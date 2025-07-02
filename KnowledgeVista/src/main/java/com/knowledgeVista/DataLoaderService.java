package com.knowledgeVista;

import java.io.InputStream;
import java.time.LocalDate;

import javax.annotation.PostConstruct;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import com.knowledgeVista.SocialLogin.SocialKeyRepo;
import com.knowledgeVista.SocialLogin.SocialLoginKeys;
import com.knowledgeVista.User.Muser;
import com.knowledgeVista.User.MuserRoles;
import com.knowledgeVista.User.Repository.MuserRepositories;
import com.knowledgeVista.User.Repository.MuserRoleRepository;

@Service
public class DataLoaderService {

	private static final Logger logger = LoggerFactory.getLogger(DataLoaderService.class);
	@Autowired
	private MuserRoleRepository muserRoleRepository;
	@Autowired
	private MuserRepositories muserrepositories;
	@Autowired
	private SocialKeyRepo SocialKeysRepo;

	@Autowired
	private BCryptPasswordEncoder passwordEncoder;

	@PostConstruct
	@Transactional
	public void init() {
		try {
			loadRoles();
			loadUsers();
			loadSocialLoginKeys();
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;

		}
	}

	private void loadRoles() {
		try {
			InputStream is = getClass().getResourceAsStream("/roles.xml");

			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			DocumentBuilder builder = factory.newDocumentBuilder();
			Document doc = builder.parse(is);

			NodeList roleNodes = doc.getElementsByTagName("role");
			for (int i = 0; i < roleNodes.getLength(); i++) {
				Element roleElement = (Element) roleNodes.item(i);
				String roleName = roleElement.getElementsByTagName("roleName").item(0).getTextContent();
				boolean isActive = Boolean
						.parseBoolean(roleElement.getElementsByTagName("isActive").item(0).getTextContent());

				// Create MuserRoles object
				MuserRoles role = new MuserRoles();
				role.setRoleName(roleName);
				role.setIsActive(isActive);

				// Check if role already exists
				if (muserRoleRepository.findByRoleName(roleName).isEmpty()) {
					muserRoleRepository.save(role);
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			// Handle exceptions as per your application's requirements
		}
	}

	private void loadUsers() {
		try {
			InputStream is = getClass().getResourceAsStream("/users.xml");

			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			DocumentBuilder builder = factory.newDocumentBuilder();
			Document doc = builder.parse(is);

			NodeList userNodes = doc.getElementsByTagName("user");

			for (int i = 0; i < userNodes.getLength(); i++) {
				Element userElement = (Element) userNodes.item(i);
				String username = userElement.getElementsByTagName("username").item(0).getTextContent();
				String password = userElement.getElementsByTagName("psw").item(0).getTextContent();
				String email = userElement.getElementsByTagName("email").item(0).getTextContent();
				LocalDate dob = LocalDate.parse(userElement.getElementsByTagName("dob").item(0).getTextContent());
				String phone = userElement.getElementsByTagName("phone").item(0).getTextContent();
				String skills = userElement.getElementsByTagName("skills").item(0).getTextContent();
				String countryCode = userElement.getElementsByTagName("countryCode").item(0).getTextContent();
				String roleName = userElement.getElementsByTagName("role").item(0).getTextContent();
				String institutionName = userElement.getElementsByTagName("institutionName").item(0).getTextContent();
				// Check if user with the same email already exists
				if (muserrepositories.findByEmail(email).isEmpty()) {
					// Find or create the role
					MuserRoles role = muserRoleRepository.findByRoleName(roleName)
							.orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

					// Create new user instance
					Muser newUser = new Muser();
					newUser.setUsername(username);
					newUser.setPassword(password, passwordEncoder);
					newUser.setEmail(email);
					newUser.setDob(dob);
					newUser.setPhone(phone);
					newUser.setSkills(skills);
					newUser.setCountryCode(countryCode);
					newUser.setInstitutionName(institutionName);
					newUser.setRole(role); // Set the role instance
					newUser.setIsActive(true); // Assuming default active status

					muserrepositories.save(newUser);
				}
			}

			// Save all valid users at once
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
			// Handle exceptions as per your application's requirements
		}
	}

	private void loadSocialLoginKeys() {
		try {
			if (SocialKeysRepo.checkIfSysAdminExists()) {
				return;
			}
			InputStream is = getClass().getResourceAsStream("/social_login_keys.xml");
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			DocumentBuilder builder = factory.newDocumentBuilder();
			Document doc = builder.parse(is);

			NodeList rootNodes = doc.getElementsByTagName("Socialkeys");
			for (int i = 0; i < rootNodes.getLength(); i++) {
				Element SocialLogin = (Element) rootNodes.item(i);
				String provider = SocialLogin.getElementsByTagName("provider").item(0).getTextContent();
				String institutionName = SocialLogin.getElementsByTagName("institutionName").item(0).getTextContent();
				String clientid = SocialLogin.getElementsByTagName("clientid").item(0).getTextContent();
				String clientSecret = SocialLogin.getElementsByTagName("clientSecret").item(0).getTextContent();
				String RedirectUrl = SocialLogin.getElementsByTagName("RedirectUrl").item(0).getTextContent();

				SocialLoginKeys keys = new SocialLoginKeys();
				keys.setProvider(provider);
				keys.setInstitutionName(institutionName);
				keys.setClientid(clientid);
				keys.setClientSecret(clientSecret);
				keys.setRedirectUrl(RedirectUrl);
				SocialKeysRepo.save(keys);
			}
		} catch (Exception e) {
			e.printStackTrace();
			logger.error("", e);
			;
		}
	}

}
