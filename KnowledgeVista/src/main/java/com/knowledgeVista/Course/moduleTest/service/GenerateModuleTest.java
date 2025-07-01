package com.knowledgeVista.Course.moduleTest.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xslf.usermodel.XMLSlideShow;
import org.apache.poi.xslf.usermodel.XSLFShape;
import org.apache.poi.xslf.usermodel.XSLFSlide;
import org.apache.poi.xslf.usermodel.XSLFTextShape;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
// import org.springframework.boot.autoconfigure.web.reactive.function.client.WebClientAutoConfiguration;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import org.springframework.web.reactive.function.client.WebClient;
import com.knowledgeVista.Course.DocsDetails;
import com.knowledgeVista.Course.videoLessons;
import com.knowledgeVista.Course.Repository.videoLessonRepo;
import com.knowledgeVista.FileService.VideoFileService;

@Service
public class GenerateModuleTest {
	private static final Logger logger = LoggerFactory.getLogger(GenerateModuleTest.class);

	@Autowired
	private videoLessonRepo lessonRepository;

	@Value("${upload.video.directory}")
	private String videoStorageDirectory;

	@Autowired
	private VideoFileService fileService;

	

	@Value("${openrouter.api.key}")
	private String openRouterApiKey;

	


	public void streamQuestionsFromLessonQwen(Long lessonId, Long count, ResponseBodyEmitter emitter) {
		Optional<videoLessons> lessonOpt = lessonRepository.findById(lessonId);
		if (!lessonOpt.isPresent()) {
			emitter.completeWithError(new Exception("Lesson not found"));
			return;
		}

		videoLessons lesson = lessonOpt.get();
		List<DocsDetails> docs = lesson.getDocuments();
		if (docs.isEmpty()) {
			emitter.completeWithError(new Exception("No documents available for this lesson"));
			return;
		}

		StringBuilder contentBuilder = new StringBuilder();
		for (DocsDetails doc : docs) {
			String filePath = doc.getDocumentPath();
			try {
				String ext = filePath.substring(filePath.lastIndexOf('.') + 1).toLowerCase();
				byte[] fileBytes = fileService.getFileAsBytes(filePath);
				if (ext.equals("pdf")) {
					contentBuilder.append(extractPdfText(fileBytes));
				} else if (ext.equals("ppt") || ext.equals("pptx")) {
					contentBuilder.append(extractPptText(fileBytes));
				}
			} catch (Exception e) {
				emitter.completeWithError(e);
				return;
			}
		}

		String prompt = buildQuestionPrompt(contentBuilder.toString(), count);
		logger.info(prompt);

		WebClient webClient = WebClient.builder()
			.baseUrl("https://openrouter.ai")
			.defaultHeader("Authorization", "Bearer " + openRouterApiKey)
			.build();

		Map<String, Object> requestBody = new HashMap<>();
		requestBody.put("model", "qwen/qwen3-30b-a3b:free");
		List<Map<String, String>> messages = List.of(
			Map.of("role", "user", "content", prompt)
		);
		requestBody.put("messages", messages);

		webClient.post()
			.uri("/api/v1/chat/completions")
			.contentType(MediaType.APPLICATION_JSON)
			.accept(MediaType.APPLICATION_NDJSON, MediaType.APPLICATION_JSON)
			.bodyValue(requestBody)
			.retrieve()
			.bodyToFlux(String.class)
			.subscribe(
				chunk -> {
					// Try to extract the 'content' field from the chunk (JSON line)
					String text = extractContentField(chunk);
					if (text != null && !text.isEmpty()) {
						logger.info(text);
						try {
							emitter.send(text);
						} catch (Exception e) {
							emitter.completeWithError(e);
						}
					}
				},
				error -> {
					logger.error("[QWEN AI ERROR] LessonId: {}", lessonId, error);
					emitter.completeWithError(error);
				},
				emitter::complete
			);
	}

	/**
	 * Extracts only the 'content' field from a JSON line (for streaming Qwen/OpenRouter).
	 */
	private String extractContentField(String jsonLine) {
		int idx = jsonLine.indexOf("\"content\":");
		if (idx != -1) {
			int start = jsonLine.indexOf('"', idx + 10) + 1;
			int end = jsonLine.indexOf('"', start);
			if (start > 0 && end > start) {
				return jsonLine.substring(start, end).replace("\\n", "\n").replace("\\\"", "\"");
			}
		}
		return null;
	}

	/**
	 * Build the prompt for the LLM.
	 */
	private String buildQuestionPrompt(String textContent, Long count) {
		return String.format(
			"""
			You are not a chatbot. You are an AI that strictly generates multiple-choice questions.
		
			Your task:
			- Generate exactly %d multiple-choice type question based ONLY on the lesson content below.
			-no need to give any explanation just give the questions with options 
		
			Output must be:
			- Plain text only.
			- Enclosed entirely in a <question>...</question> tag.
			- Formatted exactly like this:
		    -Dont make any type mistakes in tags name name the tage exactly in order 
			<question>
			<questiontext>
			 [Question text]
			</questiontext>
			<opt1>Option A</opt1>
			<opt2>Option B</opt2>
			<opt3>Option C</opt3>
			<opt4>Option D</opt4>
			<answer>[answer text]</answer>
			</question>
		
			Lesson Content:
			%s
			""",
			count, textContent
		);
	}
	/**
	 * Synchronous call for Qwen via OpenRouter API (replaces Ollama).
	 */
	
	/**
	 * Extracts text from PDF bytes.
	 */
	private static String extractPdfText(byte[] fileData) throws IOException {
		try (PDDocument document = PDDocument.load(fileData)) {
			PDFTextStripper stripper = new PDFTextStripper();
			return stripper.getText(document);
		}
	}

	/**
	 * Extracts text from PPT/PPTX bytes.
	 */
	private static String extractPptText(byte[] fileData) throws IOException {
		try (InputStream is = new ByteArrayInputStream(fileData);
			 XMLSlideShow ppt = new XMLSlideShow(is)) {
			StringBuilder sb = new StringBuilder();
			for (XSLFSlide slide : ppt.getSlides()) {
				for (XSLFShape shape : slide.getShapes()) {
					if (shape instanceof XSLFTextShape) {
						sb.append(((XSLFTextShape) shape).getText()).append("\n");
					}
				}
			}
			return sb.toString();
		}
	}
}