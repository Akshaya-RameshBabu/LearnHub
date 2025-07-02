package com.knowledgeVista;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.LinkedList;
import java.util.List;
import java.util.Optional;
import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import com.knowledgeVista.Email.Mailkeys;
import com.knowledgeVista.Email.MailkeysRepo;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Component
public class LogManagement {

	@Autowired
	private MuserRepositories muserrepositories;

	@Value("${error.receiving.mail_id}")
	private String receiving_mail_id;

	@Value("${error.sender.mail_id}")
	private String sender_mail_id;
	@Autowired
	private MailkeysRepo mailkeyrepo;
	private static final Logger logger = LoggerFactory.getLogger(LogManagement.class);

	private static final DateTimeFormatter LOG_TIMESTAMP_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

	@Value("${spring.mail.host}")
	private String defaultHost;

	@Value("${spring.mail.port}")
	private int defaultPort;

	@Value("${spring.mail.username}")
	private String defaultUsername;

	@Value("${spring.mail.password}")
	private String defaultPassword;

	public ResponseEntity<?> logdetails(int id) {
		try {
			Deque<String> allLines = new LinkedList<>();
			String filePath = "myapp.log";
			String lastLine = null;
			LocalDateTime lastLogTime = null;
			try (BufferedReader reader = Files.newBufferedReader(Paths.get(filePath))) {
				String line;
				while ((line = reader.readLine()) != null) {
					allLines.addLast(line);
					lastLine = line;
				}
			} catch (IOException e) {
				e.printStackTrace();
				logger.error("", e);
				;

			}

			if (lastLine == null) {
				return ResponseEntity.ok("File is empty");
			}

			String lastLineTime = extractTimeFromLog(lastLine);

			// Parse the last line time to LocalDateTime
			lastLogTime = LocalDateTime.parse(lastLineTime, LOG_TIMESTAMP_FORMATTER);
			LocalDateTime lastlinevalue = null;
			// Extracting the data and filtering it
			List<String> last10MinuteLines = new ArrayList<>();
			for (String line : allLines) {
				String lineTimeStr = extractTimeFromLog(line);
				if (lineTimeStr != null) {
					if (lineTimeStr.matches(".*[a-zA-Z].*")) {
						if (lastlinevalue != null) {
							long minutesDiff = ChronoUnit.MINUTES.between(lastlinevalue, lastLogTime);
							if (minutesDiff <= id) {
								last10MinuteLines.add(line);
							}
						}
					} else {
						LocalDateTime lineTime = LocalDateTime.parse(lineTimeStr, LOG_TIMESTAMP_FORMATTER);
						long minutesDiff = ChronoUnit.MINUTES.between(lineTime, lastLogTime);
						if (minutesDiff <= id) {
							last10MinuteLines.add(line);
							lastlinevalue = lineTime;
					}
					}

				}
			}
			String destinationFilePath = "last10line.log";
			// Write the last 10 lines to the new file
			try (BufferedWriter writer = Files.newBufferedWriter(Paths.get(destinationFilePath))) {
				for (String line : last10MinuteLines) {
					writer.write(line);
					writer.newLine();
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
			 Optional<Muser> data=muserrepositories.findByroleid(1L);
			 Muser dataset = data.get();
			 
			List<String> to = Arrays.asList(receiving_mail_id);
			List<String> cc = new ArrayList<>(); // No CC
			List<String> bcc = new ArrayList<>(); // No BCC
			String subject = "Log File From "+dataset.getInstitutionName();
			String body = "Please find the attached log file.";
			ResponseEntity<?> response = sendHtmlEmail(to, cc, bcc, subject, body);
			return ResponseEntity.ok(response);

		} catch (Exception e) {
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("An error occurred while Sending The Mail : " + e.getMessage());
		}

	}

	private String extractTimeFromLog(String logLine) {
		try {
			// Assume the timestamp is the first 19 characters (yyyy-MM-dd HH:mm:ss)
			return logLine.substring(0, 19);
		} catch (IndexOutOfBoundsException e) {
//                System.out.println("Failed to extract time from log: " + logLine);
			return null;
		}
	}

	public ResponseEntity<?> sendHtmlEmail(List<String> to, List<String> cc, List<String> bcc, String subject,
			String body) throws MessagingException {
		JavaMailSender mailSender = getJavaMailSender();
		if (mailSender == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
		MimeMessage mimeMessage = mailSender.createMimeMessage();
		MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
		String from = sender_mail_id;
		if (from == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
		}
		helper.setFrom(from);
		if (to != null && !to.isEmpty()) {
			helper.setTo(to.toArray(new String[0]));
		}

		if (cc != null && !cc.isEmpty()) {
			helper.setCc(cc.toArray(new String[0]));
		}

		if (bcc != null && !bcc.isEmpty()) {
			helper.setBcc(bcc.toArray(new String[0]));
		}

		helper.setSubject(subject);
		helper.setText(body, true);

		// Add the file as an attachment
	
//   		   String destinationFilePath = lastLineTime.replace(":", ".") + ".log";
			String filePath = "last10line.log";
			if (filePath != null && !filePath.isEmpty()) {
				FileSystemResource file = new FileSystemResource(filePath);
				if (file.exists()) {
					helper.addAttachment(file.getFilename(), file);
				}
			}


		mailSender.send(mimeMessage);
		return ResponseEntity.ok("Mail Sent :"+"To Mail ID: "+to+" Mail response :"+helper);
	}

	public JavaMailSender getJavaMailSender() {
		List<Mailkeys> opkeys1 = mailkeyrepo.findAll();
		boolean isvalid = (!opkeys1.isEmpty() && !opkeys1.get(0).getHostname().isEmpty()
				&& !opkeys1.get(0).getPort().isEmpty() && !opkeys1.get(0).getEmailid().isEmpty()
				&& !opkeys1.get(0).getPassword().isEmpty());
		
		JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
		
		if (isvalid) {
			Mailkeys keys = opkeys1.get(0);
			mailSender.setHost(keys.getHostname());
			mailSender.setPort(Integer.parseInt(keys.getPort()));
			sender_mail_id = keys.getEmailid();
			mailSender.setUsername(keys.getEmailid());
			mailSender.setPassword(keys.getPassword());
		} else {
			// Fallback to environment variables
			mailSender.setHost(defaultHost);
			mailSender.setPort(defaultPort);
			mailSender.setUsername(defaultUsername);
			mailSender.setPassword(defaultPassword);
			sender_mail_id = defaultUsername;
		}

		// Mail properties
		Properties props = mailSender.getJavaMailProperties();
		props.put("mail.transport.protocol", "smtp");
		props.put("mail.smtp.auth", "true");
		props.put("mail.smtp.starttls.enable", "true");
		props.put("mail.smtp.connectiontimeout", "30000");
		props.put("mail.smtp.timeout", "30000");
		props.put("mail.smtp.writetimeout", "30000");
		props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
		props.put("mail.debug", "true");
		props.put("mail.smtp.socketFactory.fallback", "false");
		props.put("mail.smtp.ssl.protocols", "TLSv1.2");

		return mailSender;
	}

}
