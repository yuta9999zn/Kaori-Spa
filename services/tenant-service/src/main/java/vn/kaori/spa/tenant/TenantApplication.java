package vn.kaori.spa.tenant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"vn.kaori.spa.tenant", "vn.kaori.spa.shared"})
public class TenantApplication {
    public static void main(String[] args) {
        SpringApplication.run(TenantApplication.class, args);
    }
}
