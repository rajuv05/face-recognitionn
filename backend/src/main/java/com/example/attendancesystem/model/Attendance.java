package com.example.attendancesystem.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
        name = "attendance",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"rollNo", "date", "lecture", "slot"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String rollNo;

    private String lecture;

    private Integer slot;

    private LocalDate date;

    @Column(nullable = false)
    private LocalTime time;

}
