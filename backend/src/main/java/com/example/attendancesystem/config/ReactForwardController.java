package com.example.attendancesystem.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class ReactForwardController {

    // Match everything except /api/** and /error
    @RequestMapping(value = {
            "/{path:^(?!api$|error$).*$}",
            "/{path:^(?!api$|error$).*$}/**"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
