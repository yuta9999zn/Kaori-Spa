package vn.kaori.spa.booking.outbox;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Component;
import vn.kaori.spa.shared.outbox.OutboxEvent;
import vn.kaori.spa.shared.outbox.OutboxEventStore;

import java.util.List;
import java.util.UUID;

public interface BookingOutboxRepository extends JpaRepository<BookingOutboxEvent, UUID> {

    @Query("SELECT e FROM BookingOutboxEvent e WHERE e.publishedAt IS NULL " +
           "ORDER BY e.createdAt ASC")
    List<BookingOutboxEvent> findUnpublished(org.springframework.data.domain.Pageable pageable);

    @Component
    class Store implements OutboxEventStore {
        private final BookingOutboxRepository repo;
        public Store(BookingOutboxRepository repo) { this.repo = repo; }

        @Override
        public List<? extends OutboxEvent> fetchUnpublished(int limit) {
            return repo.findUnpublished(org.springframework.data.domain.PageRequest.of(0, limit));
        }
        @Override
        public void save(OutboxEvent event) { repo.save((BookingOutboxEvent) event); }
    }
}
