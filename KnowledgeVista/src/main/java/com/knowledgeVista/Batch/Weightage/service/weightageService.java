package com.knowledgeVista.Batch.Weightage.service;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.knowledgeVista.Batch.Weightage.Weightage;
import com.knowledgeVista.Batch.Weightage.repo.WeightageRepo;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;

@Service
public class weightageService {
	private final WeightageRepo weightageRepo;
    private final MuserRepositories muserRepository;
    private final JwtUtil jwtUtil;
    private static final Logger logger = LoggerFactory.getLogger(weightageService.class);
	
	
	public weightageService(WeightageRepo weightageRepo, MuserRepositories muserRepository, JwtUtil jwtUtil) {
		super();
		this.weightageRepo = weightageRepo;
		this.muserRepository = muserRepository;
		this.jwtUtil = jwtUtil;
	}


	public ResponseEntity<?>saveOrUpdateWeightageDetails(Weightage weightage,String token){
		try {
			  String role=jwtUtil.getRoleFromToken(token);
			  String email=jwtUtil.getEmailFromToken(token);
			  if("ADMIN".equals(role)||"TRAINER".equals(role)) {
					
				  String institution=muserRepository.findinstitutionByEmail(email);
				  if(institution==null) {
					  return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("institution Not Found");
				  }
				  Integer total = weightage.getAssignmentWeightage() 
				            + weightage.getAttendanceWeightage() 
				            + weightage.getQuizzWeightage() 
				            + weightage.getTestWeightage();

				if (total < 100) {
				    return ResponseEntity.badRequest().body("Total weightage must be 100%");
				}
				   Optional<Weightage> opWeightage= weightageRepo.findbyInstittionName(institution);
				  if(opWeightage.isPresent())
				  {
					  Weightage old=opWeightage.get();
					  old.setAssignmentWeightage(weightage.getAssignmentWeightage());
					  old.setAttendanceWeightage(weightage.getAttendanceWeightage());
					  old.setPassPercentage(weightage.getPassPercentage());
					  old.setQuizzWeightage(weightage.getQuizzWeightage());
					  old.setTestWeightage(weightage.getTestWeightage());
					  weightageRepo.save(old);
					  return ResponseEntity.ok("Updated");
				  }else {
				  weightage.setInstitutionName(institution);
				  weightageRepo.save(weightage);
				  return ResponseEntity.ok("Saved");
				  }
			  }
			  return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Authorized users can access this page");
		}catch (Exception e) {
			logger.error("error At saveOrUpdateWeightageDetails"+e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}
	//common method
	public Weightage getWeightage(String institution) {
	    return weightageRepo.findbyInstittionName(institution)
	            .orElse(new Weightage()); // ✅ Uses default constructor instead of set methods
	}
	public ResponseEntity<?>GetWeightageDetails(String token){
		try {
			  String role=jwtUtil.getRoleFromToken(token);
			  String email=jwtUtil.getEmailFromToken(token);
			  if("ADMIN".equals(role)||"TRAINER".equals(role)) {
					
				  String institution=muserRepository.findinstitutionByEmail(email);
				  if(institution==null) {
					  return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("institution Not Found");
				  }
				  Optional<Weightage> opWeightage= weightageRepo.findbyInstittionName(institution);
					 if(opWeightage.isPresent())
					  {
						 Weightage weight=opWeightage.get();
						 return ResponseEntity.ok(weight);
					  }else {
						  return ResponseEntity.status(HttpStatus.NO_CONTENT).body("weightage Details not Found");
					  }
			  }
			  return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only Authorized users can access this page");
		}catch (Exception e) {
			logger.error("error At GetWeightageDetails "+e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
		}
	}

}
