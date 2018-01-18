$(document).ready(function() {

    $('#form_remove_user').on('submit', function(e) {

        e.preventDefault();
        const form = $(this);
        var formData = false;

        if (window.FormData) {
            formData = new FormData(form[0]);
        }

        $.ajax({
            type: 'POST',
            url: '/settings/remove',
            data: formData ? formData : form.serialize,
            processData: false, 
            contentType: false,

            complete: function() {
                console.log('complete');
            },
            success: function() {
                console.log('success');
            },
            fail: function() {
                console.log('failure');
            },
            error: function(error) {
                console.log('error', error.responseText);
            }
        })
    })
})