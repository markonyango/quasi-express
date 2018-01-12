$(document).ready(function() {
    $('#type').on('change', function(event){
        const selected = $('#type option:selected').val();
        if(selected === 'dea'){
            $('#options_dea').show();
        } else {
            $('#options_dea').hide();
        }
    });
});