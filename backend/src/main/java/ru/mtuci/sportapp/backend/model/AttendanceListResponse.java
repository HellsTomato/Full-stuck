package ru.mtuci.sportapp.backend.model;

import java.util.List;

// Обёртка для ответа { items: [...] }
public class AttendanceListResponse {

    private List<AttendanceDto> items;

    public AttendanceListResponse() {
    }

    public AttendanceListResponse(List<AttendanceDto> items) {
        this.items = items;
    }

    public List<AttendanceDto> getItems() {
        return items;
    }

    public void setItems(List<AttendanceDto> items) {
        this.items = items;
    }
}
