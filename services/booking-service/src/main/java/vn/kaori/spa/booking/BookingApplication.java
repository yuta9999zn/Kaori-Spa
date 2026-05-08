package vn.kaori.spa.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = {"vn.kaori.spa.booking", "vn.kaori.spa.shared"})
@EnableJpaRepositories(
        basePackages = "vn.kaori.spa.booking",
        considerNestedRepositories = true)
@EnableScheduling
public class BookingApplication {
    public static void main(String[] args) {
        SpringApplication.run(BookingApplication.class, args);
    }
}
