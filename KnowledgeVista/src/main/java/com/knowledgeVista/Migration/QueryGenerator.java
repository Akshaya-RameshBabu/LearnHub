package com.knowledgeVista.Migration;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.knowledgeVista.Course.CourseDetailDto;
import com.knowledgeVista.Course.Repository.CourseDetailRepository;
import com.knowledgeVista.Course.certificate.certificateRepo;
import com.knowledgeVista.Email.Mailkeys;
import com.knowledgeVista.Email.MailkeysRepo;
import com.knowledgeVista.License.License;
import com.knowledgeVista.License.Madmin_Licence;
import com.knowledgeVista.License.licenseRepository;
import com.knowledgeVista.License.mAdminLicenceRepo;
import com.knowledgeVista.SocialLogin.SocialKeyRepo;
import com.knowledgeVista.SocialLogin.SocialLoginKeys;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;

import jakarta.persistence.EntityManager;

@RestController
public class QueryGenerator {

	@Autowired
	public MuserRepositories muser;

	@Autowired
	public certificateRepo certificatere;

	@Autowired
	public CourseDetailRepository Course;

	@Autowired
	private mAdminLicenceRepo madminRepository;

	@Autowired
	private licenseRepository licenseRepository;

	@Autowired
	private MailkeysRepo mailkeyRepository;

	@Autowired
	private SocialKeyRepo SocialKeyRepository;

	@Autowired
	private EntityManager entityManager;

	@Value("${upload.licence.directory}")
	private String path;

	@Value("${upload.backup}")
	private String backupPath;

	@Value("${spring.datasource.username}")
	private String dbUsername;

	@Value("${spring.datasource.url}")
	private String dbUrl;
	@Value("${spring.datasource.password}")
	private String dbPassword;
	@Value("${database.name}")
	private String dbName;

	private static final Logger logger = LoggerFactory.getLogger(QueryGenerator.class);

	@GetMapping("/switch-database")
	public void generateInsertStatements() {
		// Fetch all Muser records
		try {
//			 List<Muser> Muser = muser.findAll();
			String institutionName = "Admin";

			// Add data based on the Admin name for user details (muser table)
//			 List<MuserMigrationDto>test= muser.findAllByInstitutionNameDto("Admin");
//		        this.writeDataToFile(test, "Muser");

			List<Muser> test = muser.findByInstitutionNameall("Admin");
			this.writeDataToFile(test, "Muser");

			// Add data based on the InstitutionName name for certificate(certificate table)
//		     Optional<certificate> certificate=certificatere.findByInstitution(institutionName);
//		        this.writeDataToFile(Certificate, "Certificate");
//		        
			// Add data based on the InstitutionName name for CourseDetail(CourseDetail
			// table)
			List<CourseDetailDto> CourseDetail = Course.findAllByInstitutionNameDto(institutionName);
			this.writeDataToFile(CourseDetail, "CourseDetail");

			// Add data based on the InstitutionName name for license(license table)
			Optional<License> License = licenseRepository.findByinstitution(institutionName);
			if (License.isPresent()) {
				this.writeDataToFile(License, "License");
			} else {
				System.out.println("No License found for institution: " + institutionName);
			}

			// Add data based on the InstitutionName name for Madmin_Licence(Madmin_Licence
			// table)
			Madmin_Licence Madmin_Licence = madminRepository.findByInstitutionName(institutionName);
			List<Madmin_Licence> madminLicence = new ArrayList<>();
			if (Madmin_Licence != null) {
				madminLicence.add(Madmin_Licence);
			}
			this.writeDataToFile(madminLicence, "MadminLicence");

			// Add data based on the InstitutionName name for Mailkeys(Mailkeys table)
			Optional<Mailkeys> Mailkeys = mailkeyRepository.FindMailkeyByInstituiton(institutionName);
			if (Mailkeys.isPresent()) {
				this.writeDataToFile(Mailkeys, "Mailkeys");
			} else {
				System.out.println("No Mailkeys found for institution: " + institutionName);
			}

			// Add data based on the InstitutionName name for
			// SocialLoginKeys(SocialLoginKeys table)
			List<SocialLoginKeys> SocialLoginKey = SocialKeyRepository
					.FindSocialLoginKeysByInstituiton(institutionName);
			this.writeDataToFile(SocialLoginKey, "SocialLoginKeys");

//			// Add data based on the InstitutionName name for videoLessons(videoLessons table) 
//				 List<VideoLessonsMigrationDto>videoLessons=videoLessonRepository.findAllByVideoLessonsMigrationDto(institutionName);
//				 this.writeDataToFile(videoLessons, "videoLessons");
//			 muser.findByInstitutionName(institutionName)
//		        .ifPresentOrElse(
//		            user -> System.out.println("Found user: " + user.getUsername()),
//		            () -> System.out.println("No user found for institution: " + institutionName)
//		        );

//		        // Write the users list to the JSON file
//		        ObjectMapper objectMapper = new ObjectMapper();
//		        objectMapper.registerModule(new JavaTimeModule()); // Register the JSR310 module
//		        objectMapper.enable(SerializationFeature.INDENT_OUTPUT); // Pretty print JSON
//		        objectMapper.writeValue(outputFile, users);
////		         Log the output file location
//		        System.out.println("Data successfully saved to: " + outputFile.getAbsolutePath());
//		        return videoLessons;
		} catch (Exception e) {
			e.printStackTrace(); // This will print the full stack trace to the console
			throw new RuntimeException("Failed to access field: " + e.getMessage(), e);
//			    return e;
		}
	}

	public void ensureBackupDirectoryExists() {
		File backupDir = new File(backupPath);
		if (!backupDir.exists()) {
			boolean isCreated = backupDir.mkdirs();
			if (isCreated) {
				System.out.println("Backup directory created: " + backupPath);
			} else {
				System.err.println("Failed to create backup directory: " + backupPath);
			}
		} else {
			System.out.println("Backup directory already exists: " + backupPath);
		}
	}

	@GetMapping("/load-users")
	@Transactional
	public List<Muser> loadUsersFromJsonFile() {
		String directoryPath = backupPath; // Set this to your actual directory
		String fileName = "Muser.json";
		File inputFile = Paths.get(directoryPath, fileName).toFile(); // Correct way to define the file path

		try {
			// Ensure the file exists before attempting to read
			if (!inputFile.exists()) {
				System.out.println("File not found: " + inputFile.getAbsolutePath());
				return Collections.emptyList(); // Return an empty list instead of proceeding
			}

			// Initialize ObjectMapper
			ObjectMapper objectMapper = new ObjectMapper();
			objectMapper.registerModule(new JavaTimeModule());

			// Read JSON file and convert to list
			List<Muser> users = objectMapper.readValue(inputFile, new TypeReference<List<Muser>>() {
			});

			muser.deleteAll();
			entityManager.flush();
			entityManager.clear();

			// Save to database
			muser.saveAll(users);

			System.out.println("Data successfully inserted into the database!");
			return users; // Return the inserted users

		} catch (IOException e) {
			throw new RuntimeException("Failed to read JSON file: " + inputFile.getAbsolutePath(), e);
		}
	}

//	 public  List<Muser>  JsonFileToDataBase() {
//	        // Specify the path to the JSON file
//	        String directoryPath = path; // Set this to the directory where your file is saved
//	        String fileName = "admin.json";
//	        File inputFile = new File(directoryPath, fileName);
//	        try {
//	            // Ensure the file exists before attempting to read
//	            if (!inputFile.exists()) {
//	            	System.out.println("File not found------------------------ ");
//	            }
//	            // Read the JSON file into a list of Muser objects
//	            ObjectMapper objectMapper = new ObjectMapper();
//	            objectMapper.registerModule(new JavaTimeModule()); // Register the JavaTime module
//	            objectMapper.enable(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT); // Handle empty strings gracefully
//	            List<Muser> users = objectMapper.readValue(inputFile, objectMapper.getTypeFactory().constructCollectionType(List.class, Muser.class));
//	            // Save the users into the database
//	            muser.saveAll(users);
//	            // Return success message
//	            return users;
//	        } catch (IOException e) {
//	            // Handle any errors that occur during file reading or database saving
//	            e.printStackTrace();
//	            throw new RuntimeException("Failed to access field: ", e);
//	        }
//	    }

//	 public List<Muser> DataBaseToJsonFile() {
//	        // Fetch all Muser records
//		 try {
//			 List<Muser> users = muser.findAll();
//		        // Define the directory and file path
//		        String directoryPath = path; // Specify your desired directory path
//		        System.out.println("Directory path: " + directoryPath);
//		        Path directory = Paths.get(directoryPath);
//		        // Ensure the directory exists
//		        if (!Files.exists(directory)) {
//		            Files.createDirectories(directory);
//		        }
//		        // Define the output file name
//		        String fileName = "admin.json";
//		        File outputFile = new File(directoryPath, fileName);
//		        // Write the users list to the JSON file
//		        ObjectMapper objectMapper = new ObjectMapper();
//		        objectMapper.registerModule(new JavaTimeModule()); // Register the JSR310 module
//		        objectMapper.enable(SerializationFeature.INDENT_OUTPUT); // Pretty print JSON
//		        objectMapper.writeValue(outputFile, users);
//		        // Log the output file location
//		        System.out.println("Data successfully saved to: " + outputFile.getAbsolutePath());
//		        return users;
//			} catch (Exception e) {
//			    throw new RuntimeException("Failed to access field: ", e);
////			    return e;
//			}
//	    }

//	 public <T> void writeDataToFile(T data, String fileName) {
//	        try {
//	        	  String directoryPath = backupPath; // Specify your desired directory path
//	        	Path directory = Paths.get(directoryPath);
//		        // Ensure the directory exists
//		        if (!Files.exists(directory)) {
//		            Files.createDirectories(directory);
//		        }
//		        // Define the output file name
//		        fileName += ".json";
//		        File outputFile = new File(directoryPath, fileName);
//	            // Initialize ObjectMapper for JSON serialization
//	            ObjectMapper objectMapper = new ObjectMapper();
//	            objectMapper.registerModule(new JavaTimeModule()); // For Java 8 date-time support
//	            objectMapper.enable(SerializationFeature.INDENT_OUTPUT); // Pretty print JSON
//
//	            // Handle different types of input
//	            if (data instanceof List<?>) {
//	                // If the data is a list, directly serialize it
//	                objectMapper.writeValue(outputFile, data);
//	            } else if (data instanceof Optional<?>) {
//	                Optional<?> optionalData = (Optional<?>) data;
//	                if (optionalData.isPresent()) {
//	                    objectMapper.writeValue(outputFile, optionalData.get());
//	                } else {
//	                    throw new IllegalArgumentException("Optional value is empty!");
//	                }
//	             
//	            } else {
//	                throw new IllegalArgumentException("Unsupported data type: " + data.getClass());
//	            }
//
//	            System.out.println("Data successfully saved to: " + outputFile.getAbsolutePath());
//	        } catch (Exception e) {
//	            throw new RuntimeException("Failed to write data to file", e);
//	        }
//	 }
	public <T> void writeDataToFile(T data, String fileName) {
		try {
			Path directory = Paths.get(backupPath);
			// Ensure the directory exists
			if (!Files.exists(directory)) {
				Files.createDirectories(directory);
			}

			// Define output file path
			Path outputFile = directory.resolve(fileName + ".json");

			// Initialize ObjectMapper
			ObjectMapper objectMapper = new ObjectMapper();
			objectMapper.registerModule(new JavaTimeModule()); // Handle Java 8+ date/time
			objectMapper.enable(SerializationFeature.INDENT_OUTPUT); // Pretty print JSON

			// Serialize data to JSON
			String jsonData;
			if (data instanceof Optional<?> optionalData) {
				jsonData = optionalData.map(value -> {
					try {
						return objectMapper.writeValueAsString(value);
					} catch (JsonProcessingException e) {
						throw new RuntimeException("JSON conversion failed", e);
					}
				}).orElseThrow(() -> new IllegalArgumentException("Optional value is empty!"));
			} else {
				jsonData = objectMapper.writeValueAsString(data);
			}

			// Write JSON to file
			Files.write(outputFile, jsonData.getBytes());

			System.out.println("Data successfully saved to: " + outputFile.toAbsolutePath());

		} catch (IOException e) {
			throw new RuntimeException("I/O operation failed", e);
		} catch (Exception e) {
			throw new RuntimeException("Failed to write data to file", e);
		}
	}

	// -------------------Akshaya Code--------------------

}
