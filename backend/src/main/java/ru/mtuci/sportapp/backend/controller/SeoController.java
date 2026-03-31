package ru.mtuci.sportapp.backend.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Простой контроллер для отдачи sitemap.xml и robots.txt
 * Легковесная реализация, достаточная для ЛР: отдаёт список публичных URL
 * и блокирует доступ к API-эндпоинтам в robots.txt.
 */
@RestController
public class SeoController {

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap(HttpServletRequest request) {
        String base = baseUrl(request);

        // Вариант самый простой: перечисляем основные публичные страницы.
        // При необходимости сюда можно добавить динамическую генерацию из БД.
        String[] paths = new String[]{
                "/",
                "/dashboard",
                "/athletes",
                "/reports",
                "/trainers"
        };

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        for (String p : paths) {
            sb.append("  <url>\n");
            sb.append("    <loc>").append(base).append(p).append("</loc>\n");
            sb.append("    <changefreq>weekly</changefreq>\n");
            sb.append("    <priority>0.8</priority>\n");
            sb.append("  </url>\n");
        }
        sb.append("</urlset>");
        return sb.toString();
    }

    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public String robots(HttpServletRequest request) {
        String base = baseUrl(request);
        // Простые правила: запрещаем сканирование API и приватных разделов, позволяем всё остальное.
        return "User-agent: *\n" +
                "Disallow: /api/\n" +
                "Disallow: /admin/\n" +
                "Allow: /\n" +
                "\n" +
                "# Sitemap location\n" +
                "Sitemap: " + base + "/sitemap.xml\n";
    }

    private String baseUrl(HttpServletRequest request) {
        String scheme = request.getScheme(); // http or https
        String serverName = request.getServerName();
        int port = request.getServerPort();
        boolean standardPort = ("http".equalsIgnoreCase(scheme) && port == 80) || ("https".equalsIgnoreCase(scheme) && port == 443);
        return scheme + "://" + serverName + (standardPort ? "" : ":" + port);
    }
}
