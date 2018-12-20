import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {greenLines} from './code-analyzer';
import {redLines} from './code-analyzer';
import * as astring from 'astring';


$(document).ready(function () {
    $('#inputPlaceholder').val('Enter Input Vector Here');
    $('#codePlaceholder').val('Enter Code Here');
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let inputVector = JSON.parse('[' + $('#inputPlaceholder').val() + ']');
        let parsedCode = parseCode(codeToParse,inputVector);
        let codeToColor = astring.generate(parsedCode,inputVector);
        $('#parsedCode').val(codeToColor);
        colorLines();
        //$('#parsedCode').val(JSON.stringify(escodegen.generate(parsedCode), null, 2));
    });
});

let colorLines = () => {
    var textArea = $('#parsedCode');
    var lines = textArea.val().split('\n');
    textArea.val('');
    let res = '';
    for (var i = 0; i < lines.length; i++) {
        let prop = 'lightgreen';
        if (greenLines.includes(i+1)) {
            res += '<div style="background-color: ' + prop + '">' + lines[i].bold() + '</div>';
        } else if(redLines.includes(i+1)){
            prop = 'red';
            res += '<div style="background-color: ' + prop + '">' + lines[i].bold() + '</div>';
        } else
        {
            res += '<div>' + lines[i] + '</div>' ;
        }
    }
    document.getElementById('printedLines').innerHTML = res;
};
