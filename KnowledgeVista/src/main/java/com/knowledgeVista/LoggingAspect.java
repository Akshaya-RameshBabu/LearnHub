package com.knowledgeVista;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;
import com.knowledgeVista.User.SecurityConfiguration.JwtUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.lang.reflect.Parameter;

@Aspect
@Component
public class LoggingAspect {
    private static final Logger auditLogger = LoggerFactory.getLogger("AUDIT_LOG");
    private static final ObjectMapper objectMapper = new ObjectMapper();

    // List of parameter names that contain sensitive data
    private static final Set<String> SENSITIVE_PARAMS = new HashSet<>(Arrays.asList(
        "password", "psw", "token", "secret", "key", "creditCard",
        "ssn", "dob", "birthDate", "securityCode", "pin"
    ));

    // List of fields to mask in JSON objects
    private static final Set<String> SENSITIVE_FIELDS = new HashSet<>(Arrays.asList(
        "password", "psw", "token", "secret", "key", "creditCard",
        "ssn", "dob", "birthDate", "securityCode", "pin"
    ));

    @Autowired
    private JwtUtil jwtUtil;

    @Pointcut("within(com.knowledgeVista.FrontController)")
    public void frontControllerMethods() {}

    @Around("frontControllerMethods()")
    public Object auditOperation(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().getName();
        
        try {
            // Set up context information with request hash
            String requestHash = setupSecureAuditContext();

            // Log the request with sanitized data
            logSecureAuditRequest(joinPoint, requestHash);

            // Execute the method
            Object result = joinPoint.proceed();

            // Log the response with sanitized data
            logSecureAuditResponse(joinPoint, result, System.currentTimeMillis() - startTime, requestHash);

            return result;
        } catch (Throwable e) {
            // Log the error securely
            logSecureAuditError(joinPoint, e);
            throw e;
        } finally {
            MDC.clear();
        }
    }

    private String setupSecureAuditContext() {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
            String token = request.getHeader("Authorization");
            
            // Generate a unique hash for this request
            String requestHash = generateRequestHash(request);
            MDC.put("requestHash", requestHash);
            
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                String userEmail = jwtUtil.getEmailFromToken(token);
                String userRole = jwtUtil.getRoleFromToken(token);
                String institution = jwtUtil.getInstitutionFromToken(token);
                
                // Mask sensitive parts of email
                MDC.put("userEmail", maskEmail(userEmail != null ? userEmail : "anonymous"));
                MDC.put("userRole", userRole != null ? userRole : "none");
                MDC.put("institution", institution != null ? institution : "none");
                MDC.put("clientIP", maskIpAddress(getClientIP(request)));
            }
            return requestHash;
        } catch (Exception e) {
            auditLogger.warn("Could not set up secure audit context", e);
            return "unknown";
        }
    }

    private void logSecureAuditRequest(JoinPoint joinPoint, String requestHash) {
        try {
            HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.getRequestAttributes()).getRequest();
            
            // Sanitize method arguments
            String sanitizedArgs = sanitizeMethodArguments(joinPoint);

            String logMessage = String.format("REQUEST [%s]: %s %s | Method: %s | Args: %s",
                requestHash,
                request.getMethod(),
                request.getRequestURI(),
                joinPoint.getSignature().getName(),
                sanitizedArgs
            );

            auditLogger.info(logMessage);
        } catch (Exception e) {
            auditLogger.warn("Error in secure audit logging request", e);
        }
    }

    private void logSecureAuditResponse(JoinPoint joinPoint, Object result, long executionTime, String requestHash) {
        try {
            // Sanitize response data
            String sanitizedResponse = sanitizeResponseData(result);

            String logMessage = String.format("RESPONSE [%s]: Method: %s | Time: %dms | Status: SUCCESS | Response: %s",
                requestHash,
                joinPoint.getSignature().getName(),
                executionTime,
                sanitizedResponse
            );

            auditLogger.info(logMessage);
        } catch (Exception e) {
            auditLogger.warn("Error in secure audit logging response", e);
        }
    }

    private void logSecureAuditError(JoinPoint joinPoint, Throwable error) {
        try {
            // Sanitize error message to remove any sensitive data
            String sanitizedError = sanitizeErrorMessage(error.getMessage());

            String logMessage = String.format("ERROR: Method: %s | Error: %s",
                joinPoint.getSignature().getName(),
                sanitizedError
            );

            auditLogger.error(logMessage);
        } catch (Exception e) {
            auditLogger.warn("Error in secure audit logging error", e);
        }
    }

    private String sanitizeMethodArguments(JoinPoint joinPoint) {
        try {
            Object[] args = joinPoint.getArgs();
            MethodSignature signature = (MethodSignature) joinPoint.getSignature();
            Parameter[] parameters = signature.getMethod().getParameters();

            List<String> sanitizedArgs = new ArrayList<>();
            for (int i = 0; i < args.length; i++) {
                if (args[i] == null) {
                    sanitizedArgs.add("null");
                    continue;
                }

                String paramName = parameters[i].getName();
                if (SENSITIVE_PARAMS.contains(paramName.toLowerCase())) {
                    sanitizedArgs.add("*****");
                } else if (args[i] instanceof String) {
                    sanitizedArgs.add(maskSensitiveData((String) args[i]));
                } else {
                    // Convert object to JSON and mask sensitive fields
                    String json = objectMapper.writeValueAsString(args[i]);
                    sanitizedArgs.add(maskSensitiveJsonFields(json));
                }
            }
            return sanitizedArgs.toString();
        } catch (Exception e) {
            return "[Error sanitizing arguments]";
        }
    }

    private String sanitizeResponseData(Object response) {
        try {
            if (response == null) return "null";
            
            if (response instanceof String) {
                return maskSensitiveData((String) response);
            }
            
            // Convert object to JSON and mask sensitive fields
            String json = objectMapper.writeValueAsString(response);
            return maskSensitiveJsonFields(json);
        } catch (Exception e) {
            return "[Error sanitizing response]";
        }
    }

    private String sanitizeErrorMessage(String errorMessage) {
        if (errorMessage == null) return "null";
        return maskSensitiveData(errorMessage);
    }

    private String maskSensitiveData(String input) {
        if (input == null) return "null";
        
        // Mask potential sensitive patterns
        input = input.replaceAll("\\b\\d{16}\\b", "**** **** **** ****"); // Credit card
        input = input.replaceAll("\\b\\d{3}-\\d{2}-\\d{4}\\b", "***-**-****"); // SSN
        input = input.replaceAll("\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}\\b", "****@****.***"); // Email
        
        return input;
    }

    private String maskSensitiveJsonFields(String json) {
        try {
            Map<String, Object> map = objectMapper.readValue(json, Map.class);
            maskSensitiveFieldsInMap(map);
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "[Error masking JSON fields]";
        }
    }

    private void maskSensitiveFieldsInMap(Map<String, Object> map) {
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            if (SENSITIVE_FIELDS.contains(entry.getKey().toLowerCase())) {
                map.put(entry.getKey(), "*****");
            } else if (entry.getValue() instanceof Map) {
                maskSensitiveFieldsInMap((Map<String, Object>) entry.getValue());
            } else if (entry.getValue() instanceof List) {
                maskSensitiveFieldsInList((List<Object>) entry.getValue());
            }
        }
    }

    private void maskSensitiveFieldsInList(List<Object> list) {
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i) instanceof Map) {
                maskSensitiveFieldsInMap((Map<String, Object>) list.get(i));
            }
        }
    }

    private String maskEmail(String email) {
        if (email == null || email.equals("anonymous")) return email;
        int atIndex = email.indexOf('@');
        if (atIndex > 1) {
            return email.charAt(0) + "*****" + email.substring(atIndex);
        }
        return email;
    }

    private String maskIpAddress(String ip) {
        if (ip == null) return "unknown";
        String[] parts = ip.split("\\.");
        if (parts.length == 4) {
            return parts[0] + ".***.***." + parts[3];
        }
        return ip;
    }

    private String generateRequestHash(HttpServletRequest request) {
        String baseString = request.getRequestURI() + 
                          request.getMethod() + 
                          System.currentTimeMillis() + 
                          UUID.randomUUID().toString();
        return UUID.nameUUIDFromBytes(baseString.getBytes()).toString();
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
