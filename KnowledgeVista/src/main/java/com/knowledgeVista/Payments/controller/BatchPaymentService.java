package com.knowledgeVista.Payments.controller;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.knowledgeVista.Batch.Batch;
import com.knowledgeVista.Batch.BatchInstallmentdetails;
import com.knowledgeVista.Batch.Repo.BatchPartPayRepo;
import com.knowledgeVista.Batch.Repo.BatchRepository;
import com.knowledgeVista.Payments.Orderuser;
import com.knowledgeVista.Payments.Paymentsettings;
import com.knowledgeVista.Payments.Stripesettings;
import com.knowledgeVista.Payments.repos.OrderuserRepo;
import com.knowledgeVista.Payments.repos.PaymentsettingRepository;
import com.knowledgeVista.Payments.repos.Striperepo;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;

import jakarta.servlet.http.HttpServletRequest;

@Service
public class BatchPaymentService {
	@Value("${currency}")
	private String currency;

	@Autowired
	private PaymentsettingRepository paymentsetting;
	@Autowired
	private OrderuserRepo ordertablerepo;
	@Autowired
	private MuserRepositories muserRepository;
	@Autowired
	private Striperepo stripereop;

	@Autowired
	private PaymentIntegration2 payint2;
	@Autowired
	private BatchPartPayRepo partPaystruct;
	@Autowired
	private BatchRepository batchrepo;

	private static final Logger logger = LoggerFactory.getLogger(PaymentIntegration.class);

	private ResponseEntity<?> handleRazorpayCheckout(String BatchName, Long batchId, String userName, String email,
			Long amt, Long userId, Long installmentumber, String institutionName) {
		try {
			Optional<Paymentsettings> opdataList = paymentsetting.findByinstitutionName(institutionName);
			if (opdataList.isPresent()) {
				Paymentsettings data = opdataList.get();

				// Fetch Razorpay credentials
				String razorpayApiKey = data.getRazorpay_key();
				String razorpayApiSecret = data.getRazorpay_secret_key();
				String institution = data.getInstitutionName();

				// Initialize Razorpay client
				RazorpayClient client = new RazorpayClient(razorpayApiKey, razorpayApiSecret);

				// Create Razorpay order
				JSONObject orderRequest = new JSONObject();
				orderRequest.put("amount", amt * 100); // Convert amount to paisa
				orderRequest.put("currency", currency);
				orderRequest.put("receipt", "receipt_" + batchId);
				orderRequest.put("notes", new JSONObject().put("user_id", userId));
				Order order = client.orders.create(orderRequest);

				// Extract order details
				String orderId = order.get("id").toString();
				String status = order.get("status").toString();

				// Save order details to the database
				Orderuser savedOrder = saveOrderDetails(userName, email, amt, orderId, status, institution, userId,
						installmentumber, "RAZORPAY", BatchName, batchId);
				Map<String, Object> response = new HashMap<>();
				response.put("orderId", savedOrder.getOrderId());
				response.put("key", razorpayApiKey);
				response.put("description", "Payment for Batch " + savedOrder.getBatchName() + " Rs." + amt);
				response.put("name", savedOrder.getBatchName() + " (Rs." + amt + ")");

				return ResponseEntity.ok(response);
			} else {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Razorpay Payment details not found");
			}
		} catch (RazorpayException e) {
			logger.error("Error creating Razorpay order: ", e);
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body("Razorpay keys are invalid. Please check your Razorpay keys.");
		}
	}

	private Orderuser saveOrderDetails(String userName, String email, Long amt, String orderId, String status,
			String institution, Long userId, Long installmentNumber, String PaymentType, String batchName,
			Long batchId) {
		Orderuser orderTable = new Orderuser();
		orderTable.setOrderId(orderId);
		orderTable.setUserId(userId);
		orderTable.setPaymentType(PaymentType);
		orderTable.setInstitutionName(institution);
		orderTable.setUsername(userName);
		orderTable.setBatchName(batchName);
		orderTable.setBatchId(batchId);
		orderTable.setEmail(email);
		orderTable.setInstallmentnumber(installmentNumber);
		orderTable.setDate(new java.util.Date());
		orderTable.setStatus(status);
		return ordertablerepo.save(orderTable);
	}

	public ResponseEntity<?> getBatchordersummary(Map<String, Long> requestData, String token) {
		try {
			Long batchId = requestData.get("batchId");
			Long userId = requestData.get("userId");
			Long paytype = requestData.get("paytype");
			// 0->Full //1->PART
			if (batchId == null || userId == null || paytype == null) {
				System.out.println("batchId=" + batchId + "u=" + userId + "paytype=" + paytype);
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Some Values are missing");
			}
			Optional<Batch> opbatch = batchrepo.findById(batchId);
			Optional<Muser> optionalUser = muserRepository.findById(userId);

			if (opbatch.isPresent() && optionalUser.isPresent()) {

				Muser user = optionalUser.get();

				if ("ADMIN".equals(user.getRole().getRoleName()) || "TRAINER".equals(user.getRole().getRoleName())) {
					return ResponseEntity.badRequest().body("Students only can buy the batch");
				}
				Batch batch = opbatch.get();
				if (!user.getBatches().contains(batch)) {
					Long seats = batch.getNoOfSeats();
					Long filled = batch.getUserCountinBatch();
					if (seats <= filled) {
						return ResponseEntity.badRequest().body("Seats are Filled For This Batch");
					}
				}
				List<Orderuser> orderuserlist = ordertablerepo.findAllByBatchIDAndUserID(userId, batchId, "paid");
				if (paytype == 0) {
					System.out.println("full");
					return getFullBatchOrderSummary(user, batch, orderuserlist);
				} else {
					System.out.println("part");
					return getPartBatchOrderSummary(user, batch, orderuserlist);
				}
			} else {
				// Return an error response if the course is not found
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("cannot find Batch");
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error creating order: " + e.getMessage());
		}

	}

	private ResponseEntity<?> getFullBatchOrderSummary(Muser user, Batch batch, List<Orderuser> orderuserlist) {
		int amountPaid = 0;
		Long totalAmount = batch.getAmount();

		for (Orderuser order : orderuserlist) {
			amountPaid += order.getAmountReceived();
		}

		if (amountPaid == totalAmount) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Amount already paid");
		} else {
			totalAmount -= amountPaid;
		}

		Map<String, Object> response = new HashMap<>();
		response.put("amount", totalAmount);
		response.put("userId", user.getUserId());
		response.put("batchId", batch.getId());
		response.put("batchAmount", batch.getAmount());
		response.put("batchName", batch.getBatchTitle());
		response.put("url", "/full/buyBatch/create");
		response.put("paytype", "Full");
		response.put("paytypeL", 0);// 0->Full //1->PART
		response.put("installment", 1);

		return ResponseEntity.ok(response);
	}

	private ResponseEntity<?> getPartBatchOrderSummary(Muser user, Batch batch, List<Orderuser> orderuserlist) {
		try {
			List<BatchInstallmentdetails> installmentList = partPaystruct
					.findoriginalInstallmentDetailsByBatchId(batch.getId());
			installmentList.sort(Comparator.comparing(BatchInstallmentdetails::getInstallmentNumber));

			int amountPaid = orderuserlist.stream().mapToInt(Orderuser::getAmountReceived).sum();
			BatchInstallmentdetails nextInstallment = null;
			System.out.println(orderuserlist);
			System.out.println(amountPaid);
			for (BatchInstallmentdetails installment : installmentList) {
				if (amountPaid < installment.getInstallmentAmount()) {
					System.out.println("here" + amountPaid + "next0" + installment.getInstallmentAmount());
					nextInstallment = installment;
					break;
				}
				amountPaid -= installment.getInstallmentAmount();
			}

			if (nextInstallment == null) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("All installments are paid");
			}

			Map<String, Object> response = new HashMap<>();
			response.put("amount", nextInstallment.getInstallmentAmount());
			response.put("userId", user.getUserId());
			response.put("batchId", batch.getId());
			response.put("batchAmount", batch.getAmount());
			response.put("batchName", batch.getBatchTitle());
			response.put("url", "/full/buyBatch/create");
			response.put("paytype", "PART");
			response.put("paytypeL", 1);// 0->Full //1->PART
			response.put("installment", nextInstallment.getInstallmentNumber());

			return ResponseEntity.ok(response);

		} catch (Exception e) {
			logger.error("Error at Creating Part Payment Summary", e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error creating installment summary: " + e.getMessage());
		}
	}

	public ResponseEntity<?> createOrderfullforBatch(Map<String, Long> requestData, String gateway, String token,
			HttpServletRequest request) {
		try {
			Long batchId = requestData.get("batchId");
			Long userId = requestData.get("userId");
			Long partpay = requestData.get("paytypeL");
			if (batchId == null || userId == null || partpay == null) {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Some Values are missing");
			}
			Optional<Batch> batchOptional = batchrepo.findById(batchId);
			Optional<Muser> optionalUser = muserRepository.findById(userId);

			if (batchOptional.isPresent() && optionalUser.isPresent()) {
				Muser user = optionalUser.get();

				if ("ADMIN".equals(user.getRole().getRoleName()) || "TRAINER".equals(user.getRole().getRoleName())) {
					return ResponseEntity.badRequest().body("Students only can buy the course");
				}
				Batch batch = batchOptional.get();
				List<Orderuser> orderuserlist = ordertablerepo.findAllByBatchIDAndUserID(userId, batchId, "paid");

				int amount = 0;
				Long installMentNumber = 0L;
				Long amt = batch.getAmount();
				if (partpay == 0) {
					for (Orderuser order : orderuserlist) {

						amount = amount + order.getAmountReceived();
					}
					if (amount == batch.getAmount()) {
						return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Amount already paid");
					} else {
						amt = batch.getAmount() - amount;
					}
				} else {
					List<BatchInstallmentdetails> installmentList = partPaystruct
							.findoriginalInstallmentDetailsByBatchId(batch.getId());
					installmentList.sort(Comparator.comparing(BatchInstallmentdetails::getInstallmentNumber));

					int amountPaid = orderuserlist.stream().mapToInt(Orderuser::getAmountReceived).sum();
					BatchInstallmentdetails nextInstallment = null;

					for (BatchInstallmentdetails installment : installmentList) {
						if (amountPaid < installment.getInstallmentAmount()) {
							nextInstallment = installment;
							break;
						}
						amountPaid -= installment.getInstallmentAmount();
					}
					if (nextInstallment == null) {
						return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("All Installments Paid");
					}
					amt = nextInstallment.getInstallmentAmount();
					installMentNumber = nextInstallment.getInstallmentNumber();

				}
				if ("RAZORPAY".equals(gateway)) {
					return handleRazorpayCheckout(batch.getBatchTitle(), batch.getId(), user.getUsername(),
							user.getEmail(), amt, user.getUserId(), installMentNumber, user.getInstitutionName());

				} else if ("STRIPE".equals(gateway)) {
					return handleStripeCheckout(user.getUsername(), user.getEmail(), user.getUserId(),
							batch.getBatchTitle(), batch.getId(), installMentNumber, user.getInstitutionName(), amt,
							request);
				} else if ("PAYPAL".equals(gateway)) {
					return payint2.handlePaypalCheckout(user.getUsername(), user.getEmail(), user.getUserId(),
							batch.getBatchTitle(), batch.getId(), installMentNumber, user.getInstitutionName(), amt,
							request);
				} else {

					return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Unsupported payment gateway");
				}

			} else {
				// Return an error response if the course is not found
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("cannot find course");
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body("Error creating order: " + e.getMessage());
		}
	}

	private ResponseEntity<?> handleStripeCheckout(String userName, String email, Long userid, String BatchName,
			Long batchId, Long installmentNumber, String institutionName, Long amt, HttpServletRequest request) {
		try {
			Optional<Stripesettings> opdataList = stripereop.findByinstitutionName(institutionName);
			if (opdataList.isPresent()) {
				Stripesettings data = opdataList.get();

				String clientBaseUrl = request.getHeader("Origin");
				if (clientBaseUrl == null) {
					String referer = request.getHeader("Referer");
					if (referer != null) {
						clientBaseUrl = referer.split("/")[0] + "//" + referer.split("/")[2];
					}
				}
				Stripe.apiKey = data.getStripe_secret_key();
				String successUrl = clientBaseUrl + "/updatePayment";
				String cancelUrl = clientBaseUrl + "/dashboard/course";

				SessionCreateParams.LineItem.PriceData.ProductData productData = SessionCreateParams.LineItem.PriceData.ProductData
						.builder().setName(BatchName).build();
				if ((amt * 100) < 5000 && "INR".equals(currency)) {
					return ResponseEntity.status(HttpStatus.BAD_REQUEST)
							.body("The transaction amount is too small. Please ensure the amount is at least ₹50.");
				}

				SessionCreateParams.LineItem.PriceData priceData = SessionCreateParams.LineItem.PriceData.builder()
						.setCurrency(currency).setUnitAmount(amt * 100) // Amount in cents
						.setProductData(productData).build();
				SessionCreateParams.LineItem lineItem = SessionCreateParams.LineItem.builder().setPriceData(priceData)
						.setQuantity(1L).build();
				SessionCreateParams params = SessionCreateParams.builder().setMode(SessionCreateParams.Mode.PAYMENT)
						.setSuccessUrl(successUrl).setCancelUrl(cancelUrl).addLineItem(lineItem).build();

				Session session = Session.create(params);
				if (session.getId() != null) {
					saveOrderDetails(userName, email, amt, session.getId(), "CREATED", institutionName, userid,
							installmentNumber, "STRIPE", BatchName, batchId);
					Map<String, String> response = new HashMap<>();
					response.put("sessionId", session.getId());
					return ResponseEntity.ok(response);
				} else {
					return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: Session ID is null");
				}

			} else {
				return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Stripe Payment details not found");
			}

		} catch (Exception e) {
			logger.error("Error creating Stripe Checkout: ", e);
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
					.body("Stripe keys are invalid. Please check your Stripe keys.");
		}
	}

}
