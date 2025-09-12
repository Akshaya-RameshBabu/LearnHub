package com.knowledgeVista.Batch;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table
@Getter
@Setter
@NoArgsConstructor
public class BatchInstallmentdetails {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@JsonProperty("InstallmentNumber")
	private Long installmentNumber; // Changed to camelCase

	@JsonProperty("InstallmentAmount")
	private Long installmentAmount; // Changed to camelCase

	@JsonProperty("DurationInDays")
	private Long durationInDays; // Changed to camelCase

	@ManyToOne
	@JoinColumn(name = "batchPartayId", referencedColumnName = "batchPartayId")
	private Batch_partPayment_Structure partpay;

	@Override
	public String toString() {
		return "InstallmentDetails [Id=" + id + ", InstallmentNumber=" + installmentNumber + ", InstallmentAmount="
				+ installmentAmount + ", DurationInDays=" + durationInDays + ", partpay=" + partpay + "]";
	}
}
