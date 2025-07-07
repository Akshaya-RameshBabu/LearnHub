package com.knowledgeVista.Course.moduleTest.service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
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
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyEmitter;
import com.knowledgeVista.AiIntegration.AiService;
import com.knowledgeVista.Course.DocsDetails;
import com.knowledgeVista.Course.videoLessons;
import com.knowledgeVista.Course.Repository.videoLessonRepo;
import com.knowledgeVista.FileService.VideoFileService;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@Service
public class GenerateModuleTest {
	private static final Logger logger = LoggerFactory.getLogger(GenerateModuleTest.class);

	@Autowired
	private videoLessonRepo lessonRepository;

	@Value("${upload.video.directory}")
	private String videoStorageDirectory;

	@Autowired
	private VideoFileService fileService;
	@Autowired
	private JwtUtil jwtUtil;

@Autowired
private AiService aiservice;
	

	public void streamQuestionsFromLessonQwen(Long lessonId, Long count, ResponseBodyEmitter emitter,String token) {
		Optional<videoLessons> lessonOpt = lessonRepository.findById(lessonId);
		if (!lessonOpt.isPresent()) {
			emitter.completeWithError(new Exception("Lesson not found"));
			return;
		}
        String email=jwtUtil.getEmailFromToken(token);
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
         aiservice.callQwenAIAndStreamResponse(prompt, email, emitter);
		
	}

	/**
	 * Extracts only the 'content' field from a JSON line (for streaming Qwen/OpenRouter).
	 */

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
		    - please Dont make any mistakes in tags opening and closing always open and close the tag correctly. 
			- If the question or options contain <, >, or &, escape them as &lt;, &gt;, and &amp;.
			- Formatted exactly like this:
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