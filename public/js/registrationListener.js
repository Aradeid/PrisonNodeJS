/* global $ */
$(document).ready(function() {
    $("#registration-form").submit(function(event) {
        if (!validateName($("#form-firstname").val())) {
            event.preventDefault();
            $("#form-firstname-error").show().fadeOut(5000);
            return;
        } else if (!validateName($("#form-lastname").val())) {
            event.preventDefault();
            $("#form-lastname-error").show().fadeOut(5000);
            return;
        } else if (!validateEmail($("#form-email").val())) {
            event.preventDefault();
            $("#form-email-error").show().fadeOut(5000);
            return;
        } else {
            $( this ).attr("method", "POST").submit();
        }
    });
});

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function validateName(name) {
    var re = /^([A-Z])\w+$/;
    return re.test(name);
}