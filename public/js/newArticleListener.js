/* global $ */
$(document).ready(function() {
    $("#new-article-form").submit(function(event) {
        if( !$("#new-article-title").val() ) {
            event.preventDefault();
            $("#new-article-title").addClass('warning');
            $("#new-article-title").attr("placeholder", "The article must have a title!");
        } else if( !$("#new-article-content").val() ) {
            event.preventDefault();
            $("#new-article-content").addClass('warning');
            $("#new-article-content").attr("placeholder", "The article must have some content!");
        } else {
            $( this ).attr("method", "POST").submit();
        }
    });
});