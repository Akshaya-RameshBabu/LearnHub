package com.knowledgeVista.Course.moduleTest;


import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.knowledgeVista.User.Muser;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class ModuleTestActivity {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long mactivityId;

	   @ManyToOne
	    @JoinColumn(name = "userId")
	    private Muser user;
	    @ManyToOne 
	    @JoinColumn(name = "mtestId")
	    @JsonBackReference
	    private ModuleTest Mtest;
	    
	    private LocalDate testDate;
	    private Long nthAttempt;
	   
	    private Double percentage;
	    @OneToMany(mappedBy = "moduletestActivity", cascade = CascadeType.ALL, orphanRemoval = true)
	    private List<ModuleTestAnswer> answers;

}
