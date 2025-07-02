package com.knowledgeVista.Course.Controller;

import java.io.RandomAccessFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.Course.DocsDetails;
import com.knowledgeVista.Course.MiniatureDetail;
import com.knowledgeVista.Course.videoLessons;
import com.knowledgeVista.Course.Repository.CourseDetailRepository;
import com.knowledgeVista.Course.Repository.DocsDetailRepo;
import com.knowledgeVista.Course.Repository.videoLessonRepo;
import com.knowledgeVista.FileService.PPTReader;
import com.knowledgeVista.FileService.VideoFileService;
import com.knowledgeVista.License.licenseRepository;
import com.knowledgeVista.Notification.Service.NotificationService;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@CrossOrigin
public class videolessonController {
	
	 private static final Logger logger = LoggerFactory.getLogger(videolessonController.class);
	  @Value("${spring.environment}")
	    private String environment;
	@Autowired
	private MuserRepositories muserRepo;

	@Autowired
	private MuserRepositories muserRepository;
	@Autowired
	private CourseDetailRepository coursedetailrepostory;
	@Autowired
	private VideoFileService fileService;
	@Autowired
	private videoLessonRepo lessonrepo;
	@Autowired
	private JwtUtil jwtUtil;

	@Value("${upload.video.directory}")
	private String videoStorageDirectory;

	@Autowired
	private NotificationService notiservice;

	@Autowired
	private licenseRepository licencerepo;

	@Autowired
	private DocsDetailRepo docsDetailsRepository;
	
	@Autowired
	private PPTReader pptreader;

	private Boolean checkFileSize(String institution, Long totalFileSize) {
		 if(environment=="VPS") {
			return true;
		 }
	    Long maxVideoFileSize = licencerepo.FindstoragesizeByinstitution(institution) * (1024 * 1024 * 1024); // Convert GB to bytes
	    Long currentUsage = lessonrepo.findAllByInstitutionName(institution).stream()
	            .mapToLong(l -> Optional.ofNullable(l.getSize()).orElse(0L)).sum();

	    if (currentUsage + totalFileSize > maxVideoFileSize) {
	        return true;//upgrade licence
	    }

	    return false;
	}
	public ResponseEntity<String> savenote(MultipartFile file, String Lessontitle, String LessonDescription,
			MultipartFile videoFile, String fileUrl, List<MultipartFile> documentFiles, Long courseId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			String username = "";
			String institution = "";

			Optional<Muser> opuser = muserRepository.findByEmail(email);
			if (opuser.isPresent()) {
				Muser user = opuser.get();
				username = user.getUsername();
				institution = user.getInstitutionName();
				boolean adminIsActive = muserRepository.getactiveResultByInstitutionName("ADMIN", institution);
				if (!adminIsActive) {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}

			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				Optional<CourseDetail> courseDetailOptional = coursedetailrepostory
						.findByCourseIdAndInstitutionName(courseId, institution);
				if (!courseDetailOptional.isPresent()) {
					return ResponseEntity.status(HttpStatus.NOT_FOUND)
							.body("{\"message\": \"CourseDetail not found for courseId: " + courseId + "\"}");
				}
				CourseDetail courseDetail = courseDetailOptional.get();

// Initialize videoLessons entity
				videoLessons lesson = new videoLessons();
				lesson.setLessonDescription(LessonDescription);
				lesson.setLessontitle(Lessontitle);
				lesson.setCourseDetail(courseDetail);
				lesson.setInstitutionName(courseDetail.getInstitutionName());

				if (file != null) {
					lesson.setThumbnail(file.getBytes());
				}

// Save the video file if provided
				Long videoFileSize = 0L;
				if (videoFile != null) {
					videoFileSize = videoFile.getSize();
					
				} else if (fileUrl != null && !fileUrl.isEmpty()) {
					lesson.setFileUrl(fileUrl);
				} else {
					return ResponseEntity.badRequest()
							.body("{\"error\": \"Either video file or file URL must be provided\"}");
				}

// Process and save multiple document files
				List<DocsDetails> documents = new ArrayList<>();
				Long documentTotalSize = 0L;
				if (documentFiles != null && !documentFiles.isEmpty()) {
					for (MultipartFile documentFile : documentFiles) {
						if (documentFile != null && !documentFile.isEmpty()) {
							documentTotalSize += documentFile.getSize();
						}
					}
				}

// Calculate total file size
				Long totalFileSize = videoFileSize + documentTotalSize;
				lesson.setSize(totalFileSize);
				if (this.checkFileSize(courseDetail.getInstitutionName(), totalFileSize)) {
					return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(
							"Storage size for this institution exceeds the allowed limit. Upgrade your license to add more.");
				}
               
// Save the lesson and documents
				if(videoFile !=null) {
					String videoFilePath = fileService.saveVideoFile(videoFile);
					lesson.setVideofilename(videoFilePath);
				}
				videoLessons savedLesson = lessonrepo.save(lesson);
				if (documentFiles != null) {
					for (MultipartFile documentFile : documentFiles) {
						if (documentFile != null && !documentFile.isEmpty()) {
							DocsDetails document = new DocsDetails();
							String documentPath = fileService.saveVideoFile(documentFile); // Save the file using your
						    List<MiniatureDetail> minis=pptreader.getMiniatures(documentPath);
						    // file service
						    document.setMiniatureDetails(minis);
							document.setDocumentName(documentFile.getOriginalFilename());
							document.setDocumentPath(documentPath);
							document.setVideoLessons(savedLesson); // Associate with lesson
							documents.add(document);
							docsDetailsRepository.save(document); // Save each document in its repository
						}
					}
				}
// Notification logic
				String heading = "New video added!";
				String link = "/courses/java/" + courseDetail.getCourseId();
				String notificationDescription = "A new Lesson " + savedLesson.getLessontitle() + " was added in the "
						+ courseDetail.getCourseName();
				Long notifyId = notiservice.createNotification("LessonAdd", username, notificationDescription, email,
						heading, link, Optional.ofNullable(file));
				if (notifyId != null) {
					// for notification
					List<Muser> users = courseDetail.getUsers();
					List<Long> ids = new ArrayList<>();
					if (users != null) {
						for (Muser user : users) {
							ids.add(user.getUserId());
						}
					}
					notiservice.SpecificCreateNotification(notifyId, ids);
				}

				return ResponseEntity.ok("{\"message\": \"Lesson saved successfully\"}");
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {
			e.printStackTrace();    logger.error("", e);;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("{\"error\": \"Failed to save note: " + e.getMessage() + "\"}");
		}
	}

	public ResponseEntity<?> EditLessons(Long lessonId, MultipartFile file, String Lessontitle,
	        String LessonDescription, MultipartFile videoFile, String fileUrl,
	        List<MultipartFile> newDocumentFiles, List<Long> removedDetails, String token) {
try{
	    String role = jwtUtil.getRoleFromToken(token);
	    String email = jwtUtil.getEmailFromToken(token);
	    String username = "";
	    String institution = "";

	    Optional<Muser> opuser = muserRepository.findByEmail(email);
	    if (opuser.isPresent()) {
	        Muser user = opuser.get();
	        username = user.getUsername();
	        institution = user.getInstitutionName();
	        boolean adminIsactive = muserRepository.getactiveResultByInstitutionName("ADMIN", institution);
	        if (!adminIsactive) {
	            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	        }
	    } else {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	    }

	    if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
	        try {
	            Optional<videoLessons> opvideo = lessonrepo.findBylessonIdAndInstitutionName(lessonId, institution);
	            if (opvideo.isPresent()) {
	                videoLessons video = opvideo.get();
	                if (Lessontitle != null && !Lessontitle.isEmpty()) {
	                    video.setLessontitle(Lessontitle);
	                }
	                if (LessonDescription != null && !LessonDescription.isEmpty()) {
	                    video.setLessonDescription(LessonDescription);
	                }

	                if (file != null && !file.isEmpty()) {
	                    video.setThumbnail(file.getBytes());
	                }

	               Long Total=0L;
	               Long newelyaddedsize=0L;
	               Long Deleted=0L;
	                List<DocsDetails> existingDocuments = video.getDocuments(); // Fetch current documents
                      
	                // Update existing documents or remove them if not in the request
	                if (removedDetails != null && !removedDetails.isEmpty()) {
	               
	                	Iterator<Long> iterator = removedDetails.iterator(); // Use an iterator to modify the list while looping

	                	while (iterator.hasNext()) {
	                	    Long removedId = iterator.next();
	                	    
	                	    // Find the corresponding document in existingDocuments by its ID
	                	    DocsDetails existingDocument = existingDocuments.stream()
	                	        .filter(doc -> doc.getId().equals(removedId))
	                	        .findFirst()
	                	        .orElse(null);

	                	    if (existingDocument != null) {
	                	    	
	                	    	Long size=fileService.getFileSize(existingDocument.getDocumentPath());
	                	    	if(size>0) {
	                	        boolean result = fileService.deleteFile(existingDocument.getDocumentPath());
	                	        Deleted+=size;
	                	        
	                	        // Only delete the document from the repository if the file deletion was successful
	                	        if (result) {
	                	            docsDetailsRepository.delete(existingDocument);
	                	            
	                	            // Remove the document from existingDocuments
	                	            existingDocuments.remove(existingDocument);
	                	            
	                	            // Remove the ID from removedDetails using the iterator's remove method
	                	            iterator.remove();
	                	        }
	                	    	}
	                	    }
	                	}

	                }
	                if (videoFile != null) {
	                	  if (video.getVideofilename() != null) {
	                	fileService.deleteFile(video.getVideofilename());
	                	  }else {
	                		  video.setFileUrl(null);
	                	  }
	                    String videoFilePath = fileService.saveVideoFile(videoFile);
	                    newelyaddedsize += videoFile.getSize();
	                    video.setVideofilename(videoFilePath);
	                } else if (fileUrl != null && !fileUrl.isEmpty()) {
	                    if (video.getVideofilename() != null) {
	                    	   Long videoFileDeleted = fileService.getFileSize(video.getVideofilename());
	                    	   
	                    	   if(videoFileDeleted>0) {
	                    	Boolean videoresult=fileService.deleteFile(video.getVideofilename());
	                     
	                        if (videoresult) {
	                        	 Deleted+=  videoFileDeleted ;
	                            video.setVideofilename(null);
	                            video.setFileUrl(fileUrl);
	                        }
	                    } else {
	                        video.setFileUrl(fileUrl);
	                    }
	                    }
	                    }
	                

	                // Handle document details
	              

	               
	                // Add new documents (if any)
	                if (newDocumentFiles != null && !newDocumentFiles.isEmpty()) {
	                    for (MultipartFile newDocFile : newDocumentFiles) {
	                        if (newDocFile != null && !newDocFile.isEmpty()) {
	                            DocsDetails newDoc = new DocsDetails();
	                            String documentPath = fileService.saveVideoFile(newDocFile);
	                            List<MiniatureDetail> minis=pptreader.getMiniatures(documentPath);
							    // file service
	                            newDoc.setMiniatureDetails(minis);
	                            newDoc.setDocumentName(newDocFile.getOriginalFilename());
	                            newDoc.setDocumentPath(documentPath);
	                            newDoc.setVideoLessons(video); // Associate with lesson
	                            docsDetailsRepository.save(newDoc); // Save the new document
	                            newelyaddedsize += newDocFile.getSize();
	                        }
	                    }
	                }

	               Total=(video.getSize()-Deleted)+newelyaddedsize;
	                System.out.println("size"+Total);
	                video.setSize(Total);
	                if (this.checkFileSize(institution, Total)) {
	                    return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(
	                            "Video cannot be added as the size for this institution exceeds the allowed limit.");
	                }
                    
	                lessonrepo.saveAndFlush(video);

	                // Notify users about the update
	                CourseDetail updatedCourse = video.getCourseDetail();
	                List<Muser> users = updatedCourse.getUsers();
	                List<Long> ids = new ArrayList<>();
	                if (users != null) {
	                    for (Muser user : users) {
	                        ids.add(user.getUserId());
	                    }
	                }
	                String heading = "Lesson Updated!";
	                String link = updatedCourse.getCourseUrl();
	                String notificationDescription = "Lesson " + video.getLessontitle() + " in Course "
	                        + updatedCourse.getCourseName() + " was updated.";
	                Long notifyId = notiservice.createNotification("CourseAdd", username, notificationDescription, email,
	                        heading, link, Optional.ofNullable(file));
	                if (notifyId != null) {
	                    notiservice.SpecificCreateNotification(notifyId, ids);
	                    List<String> notiUserList = new ArrayList<>();
	                    notiUserList.add("ADMIN");
	                    notiservice.CommoncreateNotificationUser(notifyId, notiUserList, institution);
	                }

	                return ResponseEntity.ok("{\"message\": \"Lessons edited successfully\"}");
	            } else {
	                return ResponseEntity.notFound().build();
	            }
	        } catch (Exception e) {
	            e.printStackTrace();    logger.error("", e);;
	            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	        }
	    } else {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
	    }
}catch(Exception e){
	return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
}
	}
public ResponseEntity<?>getDocFile(String fileName, int slideNumber,String token){
	try {
		String role = jwtUtil.getRoleFromToken(token);
		String email = jwtUtil.getEmailFromToken(token);
		Optional<Muser> opuser = muserRepo.findByEmail(email);

		if (!opuser.isPresent()) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}

		Muser user = opuser.get();
		String institution = user.getInstitutionName();
		boolean adminIsactive = muserRepository.getactiveResultByInstitutionName("ADMIN", institution);
		if (!adminIsactive) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}
		if ("USER".equals(role)) {
			return this.UserAccessCheck(fileName, slideNumber, user);
		} else if ("ADMIN".equals(role)) {
			if(fileName.toLowerCase().endsWith(".pptx")||fileName.toLowerCase().endsWith(".ppt")) {
			return pptreader.getSlideImage(fileName, slideNumber);
			}else if(fileName.toLowerCase().endsWith(".pdf")) {
				return pptreader.getPdfImage(fileName, slideNumber);
			}else {
				return ResponseEntity.notFound().build();
			}
		} else if ("TRAINER".equals(role)) {
			if(fileName.toLowerCase().endsWith(".pptx")||fileName.toLowerCase().endsWith(".ppt")) {
				return pptreader.getSlideImage(fileName, slideNumber);
				}else if(fileName.toLowerCase().endsWith(".pdf")) {
					return pptreader.getPdfImage(fileName, slideNumber);
				}else {
					return ResponseEntity.notFound().build();
				}
		} else {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
		}

	} catch (Exception e) {
		// Log the exception (you can use a proper logging library)
		e.printStackTrace();    logger.error("", e);;
		// Return an internal server error response
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	}
}
public ResponseEntity<?>UserAccessCheck(String fileName, int slideNumber,Muser user){
	try {
		Optional<CourseDetail> courseofDoc= docsDetailsRepository.FindCourseByFileName(fileName);
		if(courseofDoc.isPresent()) {
			CourseDetail coursedoc=courseofDoc.get();
			
			if(coursedoc.getAmount() == 0 ||user.getCourses().contains(coursedoc)) {
				if(fileName.toLowerCase().endsWith(".pptx")||fileName.toLowerCase().endsWith(".ppt")) {
					return pptreader.getSlideImage(fileName, slideNumber);
					}else if(fileName.toLowerCase().endsWith(".pdf")) {
						return pptreader.getPdfImage(fileName, slideNumber);
					}else {
						return ResponseEntity.notFound().build();
					}
			}else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		}else {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Course Not Found");
		}
	}catch (Exception e) {
		// Log the exception (you can use a proper logging library)
		e.printStackTrace();    logger.error("", e);;
		// Return an internal server error response
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	}
}

	public ResponseEntity<?> getVideoFile(Long lessId, Long courseId, String token, HttpServletRequest request) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);
			Optional<Muser> opuser = muserRepo.findByEmail(email);

			if (!opuser.isPresent()) {
				return ResponseEntity.notFound().build();
			}

			Muser user = opuser.get();
			String institution = user.getInstitutionName();
			boolean adminIsactive = muserRepository.getactiveResultByInstitutionName("ADMIN", institution);
			if (!adminIsactive) {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
			if ("USER".equals(role)) {
				return handleUserRole(institution, lessId, courseId, user, request);
			} else if ("ADMIN".equals(role)) {
				return getVideo(institution, lessId, request);
			} else if ("TRAINER".equals(role)) {
				return handleTrainerRole(institution, lessId, courseId, user, request);
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}

		} catch (Exception e) {
			// Log the exception (you can use a proper logging library)
			e.printStackTrace();    logger.error("", e);;
			// Return an internal server error response
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

	private ResponseEntity<?> handleUserRole(String institution, Long lessId, Long courseId, Muser user,
			HttpServletRequest request) {
		Optional<CourseDetail> opcourse = coursedetailrepostory.findByCourseIdAndInstitutionName(courseId, institution);

		if (opcourse.isPresent()) {
			CourseDetail course = opcourse.get();
			if (course.getAmount() == 0) {
				return getVideo(institution, lessId, request);
			} else if (user.getCourses().contains(course)) {
				return getVideo(institution, lessId, request);
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} else {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	private ResponseEntity<?> handleTrainerRole(String institution, Long lessId, Long courseId, Muser user,
			HttpServletRequest request) {
		Optional<CourseDetail> opcourse = coursedetailrepostory.findByCourseIdAndInstitutionName(courseId, institution);
		if (opcourse.isPresent()) {
			CourseDetail course = opcourse.get();
			if (course.getAmount() == 0) {
				return getVideo(institution, lessId, request);
			} else if (user.getAllotedCourses().contains(course)) {
				return getVideo(institution, lessId, request);
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} else {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
	}

	private ResponseEntity<?> getVideo(String institution, Long lessId, HttpServletRequest request) {
		try {
			Optional<videoLessons> optionalLesson = lessonrepo.findBylessonIdAndInstitutionName(lessId, institution);
			if (!optionalLesson.isPresent()) {
				return ResponseEntity.notFound().build();
			}

			videoLessons lesson = optionalLesson.get();
			String filename = lesson.getVideofilename();

			if (filename != null) {
				Path filePath = Paths.get(videoStorageDirectory, filename);
				System.out.println("filePath" + filePath);

				logger.info("-------------------------------------------------------");
				logger.info("file path of Video File");
				logger.info("path= " + filePath);
				logger.info("-------------------------------------------------------");
				try {
					if (filePath.toFile().exists() && filePath.toFile().isFile()) {
						Resource resource = new UrlResource(filePath.toUri());
						if (resource.exists() && resource.isReadable()) {
							HttpHeaders headers = new HttpHeaders();

							// Set the Content-Type based on the file's extension
							String mimeType = Files.probeContentType(filePath);
							if (mimeType == null) {
								mimeType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
							}
							headers.add(HttpHeaders.CONTENT_TYPE, mimeType);

							// Set Content-Disposition to "inline" to stream the video inline
							headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline");

							// Define the initial chunk size (5 MB)
							final long INITIAL_CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB
							long fileSize = Files.size(filePath);

							// Get the Range header from the request
							String rangeHeader = request.getHeader(HttpHeaders.RANGE);

							if (rangeHeader.startsWith("bytes=0-")) {

								long rangeStart = 0;
								long rangeEnd = Math.min(INITIAL_CHUNK_SIZE - 1, fileSize - 1);
								long contentLength = rangeEnd - rangeStart + 1;
								System.out.println("Range Start initial: " + rangeStart + ", Range End: " + rangeEnd
										+ ", Content Length: " + contentLength);

								// Create a RandomAccessFile to read the specified range
								try (RandomAccessFile file = new RandomAccessFile(filePath.toFile(), "r")) {
									file.seek(rangeStart);
									byte[] buffer = new byte[(int) contentLength];
									file.readFully(buffer);

									// Create a ByteArrayResource to hold the requested range of bytes
									ByteArrayResource byteArrayResource = new ByteArrayResource(buffer);

									// Set the Content-Range header
									headers.add(HttpHeaders.CONTENT_RANGE,
											String.format("bytes %d-%d/%d", rangeStart, rangeEnd, fileSize));

									// Return a 206 Partial Content response
									return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).headers(headers)
											.contentLength(contentLength).body(byteArrayResource);
								}
							} else {

								// Handle range request from the client
								String[] ranges = rangeHeader.replace("bytes=", "").split("-");
								long rangeStart = Long.parseLong(ranges[0]);
								long rangeEnd = ranges.length > 1 ? Long.parseLong(ranges[1]) : fileSize - 1;

								// Calculate the content length
								long contentLength = rangeEnd - rangeStart + 1;

								System.out.println("Range Start : " + rangeStart + ", Range End: " + rangeEnd
										+ ", Content Length: " + contentLength);
								// Create a RandomAccessFile to read the specified range
								try (RandomAccessFile file = new RandomAccessFile(filePath.toFile(), "r")) {
									file.seek(rangeStart);
									byte[] buffer = new byte[(int) contentLength];
									file.readFully(buffer);

									// Create a ByteArrayResource to hold the requested range of bytes
									ByteArrayResource byteArrayResource = new ByteArrayResource(buffer);

									// Set the Content-Range header
									headers.add(HttpHeaders.CONTENT_RANGE,
											String.format("bytes %d-%d/%d", rangeStart, rangeEnd, fileSize));
									System.out.println("Range Start : " + rangeStart + ", Range End: " + rangeEnd
											+ ", Content Length: " + contentLength);

									// Return a 206 Partial Content response
									return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).headers(headers)
											.contentLength(contentLength).body(byteArrayResource);
								}
							}
						}
					} else {

						System.out.println("file is null");
					}
				} catch (Exception e) {
					// Handle exceptions
					e.printStackTrace();    logger.error("", e);;
				}

				// Return a 404 Not Found response if the file does not exist
				return ResponseEntity.notFound().build();

			} else {
				return ResponseEntity.ok(lesson.getFileUrl());
			}
		} catch (Exception e) {
			// Log the exception (you can use a proper logging library)
			e.printStackTrace();    logger.error("", e);;
			// Return an internal server error response
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}

	}

	// ```````````````````````TO get Specific
	// Lesson`````````````````````````````````````

	public ResponseEntity<?> getlessonfromId(Long lessonId, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);

			String institution = "";
			Optional<Muser> opuser = muserRepository.findByEmail(email);
			if (opuser.isPresent()) {
				Muser user = opuser.get();
				institution = user.getInstitutionName();
				boolean adminIsactive = muserRepository.getactiveResultByInstitutionName("ADMIN", institution);
				if (!adminIsactive) {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				Optional<videoLessons> oplesson = lessonrepo.findBylessonIdAndInstitutionName(lessonId, institution);
				if (oplesson.isPresent()) {
					videoLessons video = oplesson.get();
					video.setCourseDetail(null);
					video.setVideoFile(null);
					return ResponseEntity.ok(video);
				}
				return ResponseEntity.notFound().build();

			}

			else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {
			e.printStackTrace();    logger.error("", e);;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}

	}



public ResponseEntity<?>getDocsName(Long lessonId , String token){
	try {
        String role=jwtUtil.getRoleFromToken(token);
        if("ADMIN".equals(role)) {
        	return ResponseEntity.ok(docsDetailsRepository.findByLessonId(lessonId));
        }
		String email = jwtUtil.getEmailFromToken(token);
		Optional<Muser> opuser = muserRepository.findByEmail(email);
		if (opuser.isPresent()) {
			Muser user = opuser.get();
			if(user.getRole().getRoleName().equals("USER")) {
			Optional<CourseDetail> opcourse= lessonrepo.FindbyCourseByLessonId(lessonId);
			if(opcourse.isPresent()) {
				CourseDetail course=opcourse.get();
				
				if(course.getAmount()==0 ||user.getCourses().contains(course)) {
					return ResponseEntity.ok(docsDetailsRepository.findByLessonId(lessonId));
				}else {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user Not allowed to Access this course");
				}
			}else {
				return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Course Not Found");
			}
			}else if(user.getRole().getRoleName().equals("TRAINER")) {
				Optional<CourseDetail> opcourse= lessonrepo.FindbyCourseByLessonId(lessonId);
				if(opcourse.isPresent()) {
					CourseDetail course=opcourse.get();
					
					if(course.getAmount()==0 ||user.getAllotedCourses().contains(course)) {
						return ResponseEntity.ok(docsDetailsRepository.findByLessonId(lessonId));
					}else {
						return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user Not allowed to Access this course");
					}
				}else {
					return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Course Not Found");
				}
			}else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Cannot Find the User Role");
			}
		}else {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user Not Found");
		}
	}catch (Exception e) {
		e.printStackTrace();    logger.error("", e);;
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	}
}


//==================get Miniatures=========================
public ResponseEntity<?>getMiniatureDetails(Long lessonId,Long Id , String token){
	try {
        String role=jwtUtil.getRoleFromToken(token);
        if("ADMIN".equals(role)) {
        	return ResponseEntity.ok(docsDetailsRepository.findMiniatureById(Id));
        }
		String email = jwtUtil.getEmailFromToken(token);
		Optional<Muser> opuser = muserRepository.findByEmail(email);
		if (opuser.isPresent()) {
			Muser user = opuser.get();
			if(user.getRole().getRoleName().equals("USER")) {
			Optional<CourseDetail> opcourse= docsDetailsRepository.FindCourseBylessonId(lessonId);
			if(opcourse.isPresent()) {
				CourseDetail course=opcourse.get();
				
				if(course.getAmount()==0 ||user.getCourses().contains(course)) {
					return ResponseEntity.ok(docsDetailsRepository.findMiniatureById(Id));
				}else {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user Not allowed to Access this course");
				}
			}else {
				return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Course Not Found");
			}
			}else if(user.getRole().getRoleName().equals("TRAINER")) {
				Optional<CourseDetail> opcourse= docsDetailsRepository.FindCourseBylessonId(lessonId);
				if(opcourse.isPresent()) {
					CourseDetail course=opcourse.get();
					
					if(course.getAmount()==0 ||user.getAllotedCourses().contains(course)) {
						return ResponseEntity.ok(docsDetailsRepository.findMiniatureById(Id));
					}else {
						return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user Not allowed to Access this course");
					}
				}else {
					return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Course Not Found");
				}
			}else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Cannot Find the User Role");
			}
		}else {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("user Not Found");
		}
	}catch (Exception e) {
		e.printStackTrace();    logger.error("", e);;
		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
	}
}
//======================================================

	public ResponseEntity<?> deleteLessonsByLessonId(Long lessonId, String Lessontitle, String token) {
		try {
			String role = jwtUtil.getRoleFromToken(token);
			String email = jwtUtil.getEmailFromToken(token);

			String institution = "";
			Optional<Muser> opuser = muserRepository.findByEmail(email);
			if (opuser.isPresent()) {
				Muser user = opuser.get();
				institution = user.getInstitutionName();
				boolean adminIsactive = muserRepository.getactiveResultByInstitutionName("ADMIN", institution);
				if (!adminIsactive) {
					return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
			if ("ADMIN".equals(role) || "TRAINER".equals(role)) {
				Optional<videoLessons> opvideo = lessonrepo.findBylessonIdAndInstitutionName(lessonId, institution);
				if (opvideo.isPresent()) {
					videoLessons videolesson = opvideo.get();
					List<DocsDetails>docs=videolesson.getDocuments();
					if(docs.size()>0) {
					for(DocsDetails doc :docs) {
						Long sizeone =fileService.getFileSize(doc.getDocumentPath());
						 if(sizeone>0) {
						 
						 docsDetailsRepository.deleteById(doc.getId());
						 }
					}
					}
					if (videolesson.getVideofilename() != null) {
						Long sizeone=fileService.getFileSize(videolesson.getVideofilename());
						 if(sizeone>0) {
					
						 Boolean resultdeleted =fileService.deleteFile(videolesson.getVideofilename());
						if (resultdeleted) {
							lessonrepo.deleteById(lessonId);
                           
							return ResponseEntity
									.ok("{\"message\":\"Lesson " + Lessontitle + " Deleted Successfully\"}");
						} else {
							return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
									.body("{\"message\": \"Failed to delete video file associated with the note\"}");
						}
						 }else { 
								return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
										.body("{\"message\": \"Failed to delete video file associated with the note\"}");
							}
					} else {
						lessonrepo.deleteById(lessonId);
						return ResponseEntity.ok("{\"message\":\"Lesson " + Lessontitle + " Deleted Successfully\"}");
					}
					
				} else {
					return ResponseEntity.notFound().build();

				}
			} else {
				return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
			}
		} catch (Exception e) {
			e.printStackTrace();    logger.error("", e);;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}

	}

}
