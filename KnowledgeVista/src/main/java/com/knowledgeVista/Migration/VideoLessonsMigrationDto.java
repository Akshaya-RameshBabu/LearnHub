package com.knowledgeVista.Migration;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.validation.constraints.NotBlank;

public class VideoLessonsMigrationDto {
	   @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long lessonId;
	    @Column(name="institution")
	    private String institutionName;
	    @NotBlank
	    private String Lessontitle;
	    @Column(length=1000)
	    private String LessonDescription;
	    @Lob
	    @Column(name="thumbnail" ,length=1000000)
	    private byte[] thumbnail;
	    private Long size;
	    @Column(nullable = true)
	    private String videofilename;
	    @Column(nullable = true)
	    private String fileUrl;
	    
		public VideoLessonsMigrationDto(Long lessonId, String institutionName, String lessontitle,
				String lessonDescription, byte[] thumbnail, Long size, String videofilename, String fileUrl) {
			super();
			this.lessonId = lessonId;
			this.institutionName = institutionName;
			Lessontitle = lessontitle;
			LessonDescription = lessonDescription;
			this.thumbnail = thumbnail;
			this.size = size;
			this.videofilename = videofilename;
			this.fileUrl = fileUrl;
		}
	    
	    
	    
	  
	    
	    
	    

}
