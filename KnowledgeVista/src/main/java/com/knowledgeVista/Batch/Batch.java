package com.knowledgeVista.Batch;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import com.knowledgeVista.Course.CourseDetail;
import com.knowledgeVista.Meeting.zoomclass.Meeting;
import com.knowledgeVista.User.Muser;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Batch {
	 @Id
	    @GeneratedValue(strategy = GenerationType.IDENTITY)
	    private Long id; 

	    @Column(name = "batchId")
	    private String batchId;

    @Column(name = "batchTitle")
    private String batchTitle;

    @Column(name = "startDate")
    private LocalDate startDate;

    @Column(name = "endDate")
    private LocalDate endDate;
    
    @Lob
    @Column(name="BatchImage" ,length=1000000)
    private byte[] BatchImage;

    @ManyToMany(fetch = FetchType.LAZY,cascade = { CascadeType.PERSIST, CascadeType.MERGE  })
    @JoinTable(
        name = "batch_courses",
        joinColumns = @JoinColumn(name = "batch_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id")
    )
    private List<CourseDetail> courses;
    private String institutionName;
    @ManyToMany( fetch = FetchType.LAZY,cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(
        name = "batch_trainers",
        joinColumns = @JoinColumn(name = "batch_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<Muser> trainers;
    @ManyToMany( fetch = FetchType.LAZY,cascade = { CascadeType.PERSIST, CascadeType.MERGE })
    @JoinTable(
        name = "batch_users",
        joinColumns = @JoinColumn(name = "batch_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<Muser> users;
    
    @Column(name = "paytype")
	private PaymentType paytype;
    
    @ManyToMany(mappedBy = "batches", fetch = FetchType.LAZY)
    private List<Meeting> meetings;
    
    private String BatchUrl="/MyBatches";
    @Column(name = "noOfSeats")
    private Long noOfSeats;

    @Column(name = "amount")
    private Long amount;
   
    @PostLoad
    @PostPersist
    public void generateBatchId() {
        this.batchId = "batch_" + this.id;
    }
    public void setId(Long id) {
        this.id = id;
        generateBatchId(); // Call to generate the batchId when id is set
    }
    
    public long getUserCountinBatch() {
		if (users != null) {
			return (long) users.size();
		} else {
			return 0L;
		}
	}
    public void setPaytype(PaymentType paytype) {
        this.paytype = paytype;
    }
    public enum PaymentType {
        FULL, PART;
    }
	@Override
	public String toString() {
		return "Batch [id=" + id + ", batchId=" + batchId + ", batchTitle=" + batchTitle + ", startDate=" + startDate
				+ ", endDate=" + endDate + ", BatchImage=" + Arrays.toString(BatchImage) + ", courses=" + courses
				+ ", institutionName=" + institutionName + ", trainers=" + trainers + ", users=" + users + ", paytype="
				+ paytype + ", meetings=" + meetings + ", BatchUrl=" + BatchUrl + ", noOfSeats=" + noOfSeats
				+ ", amount=" + amount + "]";
	}

}
