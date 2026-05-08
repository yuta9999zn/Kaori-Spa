package vn.kaori.spa.content;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"vn.kaori.spa.content", "vn.kaori.spa.shared"})
public class ContentApplication {
    public static void main(String[] args) { SpringApplication.run(ContentApplication.class, args); }
}
