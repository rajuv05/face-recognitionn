package com.example.attendancesystem.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Student {
    @Id
    private String rollNo;

    private String name;
}
