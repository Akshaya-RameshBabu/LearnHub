package com.knowledgeVista;

import java.io.File;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;

public class PluginLoader {

	public static Object loadAiService(String jarPath) {
		try {
			File jarFile = new File(jarPath);
			if (!jarFile.exists()) {
				return null;
			}
			URL jarUrl = jarFile.toURI().toURL();
			URLClassLoader loader = new URLClassLoader(new URL[] { jarUrl }, PluginLoader.class.getClassLoader());
			Class<?> factoryClass = Class.forName("com.AiIntegration.QwenAi.PluginFactory", true, loader);
			Method factoryMethod = factoryClass.getMethod("createAiService");
			Object aiService = factoryMethod.invoke(null);
			return aiService;
		} catch (Exception e) {
			e.printStackTrace();
			return null;
		}
	}
}