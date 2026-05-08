package vn.kaori.spa.realtime.ws;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.HandlerMapping;
import org.springframework.web.reactive.handler.SimpleUrlHandlerMapping;
import org.springframework.web.reactive.socket.WebSocketHandler;
import org.springframework.web.reactive.socket.server.support.WebSocketHandlerAdapter;

import java.util.Map;

@Configuration
@RequiredArgsConstructor
public class WebSocketConfig {

    private final RealtimeWebSocketHandler handler;

    @Bean
    public HandlerMapping wsMapping() {
        SimpleUrlHandlerMapping m = new SimpleUrlHandlerMapping();
        m.setUrlMap(Map.of("/v1/ws", (WebSocketHandler) handler));
        m.setOrder(-1);
        return m;
    }

    @Bean
    public WebSocketHandlerAdapter wsAdapter() {
        return new WebSocketHandlerAdapter();
    }
}
