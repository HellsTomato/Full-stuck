// backend/src/main/java/ru/mtuci/sportapp/backend/model/UpdateInjuryStatusRequest.java
package ru.mtuci.sportapp.backend.model;

import ru.mtuci.sportapp.backend.entity.InjuryStatus;

import java.time.LocalDate;

public class UpdateInjuryStatusRequest {

    private InjuryStatus status;
    private LocalDate closedDate;

    public InjuryStatus getStatus() {
        return status;
    }

    public void setStatus(InjuryStatus status) {
        this.status = status;
    }

    public LocalDate getClosedDate() {
        return closedDate;
    }

    public void setClosedDate(LocalDate closedDate) {
        this.closedDate = closedDate;
    }
}
