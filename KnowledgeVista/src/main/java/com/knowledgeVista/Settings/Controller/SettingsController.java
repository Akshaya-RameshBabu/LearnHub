package com.knowledgeVista.Settings.Controller;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RestController;

import com.knowledgeVista.Course.Repository.CourseDetailRepository;
import com.knowledgeVista.Meeting.zoomclass.MeetingRequest.Settings;
import com.knowledgeVista.Settings.ViewSettings;
import com.knowledgeVista.Settings.Repo.ViewSettingsRepo;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@RestController
@CrossOrigin
public class SettingsController {
	@Autowired
	private ViewSettingsRepo settingsrepo;
	
	 private static final Logger logger = LoggerFactory.getLogger(SettingsController.class);

	
	 @Autowired
	 private JwtUtil jwtUtil;
	 @Autowired
	 private CourseDetailRepository courserepo;
	public Boolean isViewCourseinLandingPageEnabled() {
		try {
			if(courserepo.count()>0) {
		 Optional<ViewSettings> setting = settingsrepo.findBySettingName("viewCourseInLanding");
	        return setting.map(s -> s.getSettingValue()).orElse(true);
			}else {
				return false;
			}
		}catch(Exception e) {
			e.printStackTrace();    logger.error("", e);;
			return true;
		}
	    }
	
	 public Boolean updateViewCourseInLandingPage(Boolean isEnabled,String token) {
		 try {
	         String role = jwtUtil.getRoleFromToken(token);
	         if("ADMIN".equals(role)) {
	        	
	        Optional<ViewSettings> setting = settingsrepo.findBySettingName("viewCourseInLanding");
             
	        ViewSettings viewSettings;
	        if (setting.isPresent()) {
	            // Update existing setting
	            viewSettings = setting.get();
	           
		      
	        } else {
	            // Create new setting
	            viewSettings = new ViewSettings();
	            viewSettings.setSettingName("viewCourseInLanding");
	          
	        }
	        // Set the new value
	        viewSettings.setSettingValue(isEnabled);
	      settingsrepo.save(viewSettings);
	     
	        return true;
	         }else {
	        	 return false;
	         }
		 }catch(Exception e) {
			 e.printStackTrace();    logger.error("", e);;
			 return false;
		 }
	    }
	 
	 
	 public Boolean isSocialLoginEnabled() {
			try {
			 Optional<ViewSettings> setting = settingsrepo.findBySettingName("SocialLogin");
		        return setting.map(s -> s.getSettingValue()).orElse(true);
			}catch(Exception e) {
				e.printStackTrace();    logger.error("", e);;
				return true;
			}
		    }
	 public Boolean updateSocialLogin(Boolean isEnabled,String token) {
		 try {
	         String role = jwtUtil.getRoleFromToken(token);
	         if("ADMIN".equals(role)) {
	        	
	        Optional<ViewSettings> setting = settingsrepo.findBySettingName("SocialLogin");
             
	        ViewSettings viewSettings;
	        if (setting.isPresent()) {
	            // Update existing setting
	            viewSettings = setting.get();
	           
		      
	        } else {
	            // Create new setting
	            viewSettings = new ViewSettings();
	            viewSettings.setSettingName("SocialLogin");
	          
	        }
	        // Set the new value
	        viewSettings.setSettingValue(isEnabled);
	      settingsrepo.save(viewSettings);
	     
	        return true;
	         }else {
	        	 return false;
	         }
		 }catch(Exception e) {
			 e.printStackTrace();    logger.error("", e);;
			 return false;
		 }
	    }
	 public Long setAttendanceThresholdMinutes(Long minutes,String token) {
		 try {
			
	         String role = jwtUtil.getRoleFromToken(token);
	         if("ADMIN".equals(role)) {
	        Optional<ViewSettings> opviewSettings =settingsrepo.findBySettingName("AttendanceThresholdMinutes");
	        ViewSettings viewSettings;
	        if(opviewSettings.isPresent()) {
	        	  viewSettings = opviewSettings.get();
	        }else {
	        	  viewSettings = new ViewSettings();
		            viewSettings.setSettingName("AttendanceThresholdMinutes");
	        }
	        viewSettings.setSettingLongValue(minutes);
		      settingsrepo.save(viewSettings);
		      return minutes;
	         }else {
	        	 return null;
	         }
	    }catch (Exception e) {
		return null;
		}
}
	 public Long getAttendanceThresholdMinutes() {
		 try {
		        Optional<ViewSettings> opviewSettings =settingsrepo.findBySettingName("AttendanceThresholdMinutes");
		        ViewSettings viewSettings;
		        if(opviewSettings.isPresent()) {
		        	  viewSettings = opviewSettings.get();
		        	  return viewSettings.getSettingLongValue();
		        }else {
		        	  return 10L;
		        }
		    }catch (Exception e) {
			return 10L;
			}
	 }

}