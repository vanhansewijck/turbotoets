
function exec() {

    if (window.location.pathname !== '/mod/quiz/report.php') {
        console.log('Not in report page, skipping');
        return;
    }
    const table = document.getElementById('attempts');

    if (!table) {
        console.log('no table attempts found, skipping');
        return;
    }

    const headerRow = table.firstChild.firstChild;

    for (let i = 9; i < headerRow.children.length; i++) {
        const column = headerRow.children[i];

        var ttButton = document.createElement("button");
        ttButton.textContent = "TT"
        ttButton.dataset.column = i - 9;
        ttButton.addEventListener('click', initTTColHandler)
        
        column.appendChild(ttButton)
    }

}

function initTTColHandler(t, evt) {
    console.log('doing something');
    t.preventDefault();
    const button = t.path[0];
    initTTCol(+button.dataset.column);
}

function initTTCol(colIndex) {
    const uiColumnIndex = colIndex + 9;
    const table = document.getElementById('attempts');

    const headerRow = table.firstChild.firstChild;
    const selectedHeader = headerRow.children[uiColumnIndex];
    selectedHeader.style.minWidth = "500px";


    const tableBody = table.tBodies[0];

    for (let i = 0; i < tableBody.children.length; i++) {
        const row = tableBody.children[i];

        const cell = row.cells[uiColumnIndex];

        const a = cell.firstChild;
        const text = a.firstChild.firstChild;
        
        if (text.innerText !== 'Beoordelen vereist') {
            continue;
        }
        // hier nog extra check
        if (a.dataset.formed === 'ok') {
            continue;
        }
        doMagic(cell, colIndex);
        return;
        // const span = document.createElement('span');
        // span.innerText = '!';
        // cell.appendChild(span);
    }
}

function doMagic(cell, col) {
    const a = cell.firstChild;
    const href = a.href.replace('reviewquestion', 'comment');
    
    fetch(href)   
    .then(function(response) {
        // When the page is loaded convert it to text
        return response.text()
    })
    .then(function(html) {
        a.dataset.formed = 'ok';
        // Initialize the DOM parser
        var parser = new DOMParser();

        // Parse the text
        var doc = parser.parseFromString(html, "text/html");

        const aswerDiv = doc.getElementsByClassName('answer')[0];

        const answer = aswerDiv.firstChild.innerHTML;

        const newDiv = document.createElement('div');
        newDiv.innerHTML = answer;

        const form = doc.getElementById('manualgradingform');

        cell.appendChild(newDiv);
        cell.appendChild(createForm(form, doc, col));
        //nog iets toeveogen om aan te geven dat dit gebeurd is

    })
    .catch(function(err) {  
        console.log('Failed to fetch page: ', err);  
    });
}

function createForm(existingForm, doc, col) {
    const newForm = document.createElement('form');
    newForm.method = 'POST';
    newForm.action = existingForm.action;
    newForm.id = 'ttform';

    for (let hiddenField of getHiddenInputFields(doc)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = hiddenField.name;
        input.value = hiddenField.value;

        newForm.appendChild(input);
    }

    const existingTextArea = doc.getElementsByTagName('textarea')[0];
    const existingGrading = getGradingInputField(doc);

    const gradingSpan = document.createElement('span');
    gradingSpan.innerHTML = 'Punt: '
    const grading = document.createElement('input');
    grading.type='text';
    grading.name = existingGrading.name
    newForm.appendChild(gradingSpan);
    newForm.appendChild(grading);

    newForm.appendChild(document.createElement('br'));
    const commentSpan = document.createElement('span');
    commentSpan.innerHTML = 'Opmerkingen:'
    newForm.appendChild(commentSpan);

    const comment = document.createElement('textarea');
    comment.name = existingTextArea.name;
    comment.style.width = '100%';
    comment.rows = 3;
    comment.value = '';
    newForm.appendChild(comment);

    const submit = document.createElement('button');
    submit.dataset.column = col;
    submit.dataset.formid = newForm.id;
    
    submit.formTarget = '_blank';
    submit.innerText = 'Submit';
    submit.type = 'submit';
    submit.name = 's';
    submit.value = 'Bewaar';
    newForm.appendChild(submit);

    const submitBewaar = document.createElement('input');
    submitBewaar.type = 'hidden';
    submitBewaar.name='submit';
    submitBewaar.value = 'Bewaar';
    newForm.appendChild(submitBewaar);

    submit.addEventListener('click', submitForm);

    return newForm;
}

function submitForm(t, evt) {
    t.preventDefault();
    const submitbutton = t.path[0];
    const form = document.getElementById(submitbutton.dataset.formid)

    const data = new URLSearchParams(new FormData(form));

    fetch(form.action, {
        method: 'post',
        body: data,
    })
    .then(function(response) {
        // When the page is loaded convert it to text
        return response.text()
    })
    .then(text => {
        const cell = form.parentElement;
        form.remove();
        const okSpan = document.createElement('span');
        okSpan.innerText = 'Oké';
        cell.appendChild(okSpan);
        initTTCol(+submitbutton.dataset.column);
    })
}

function getGradingInputField(doc) {
    for (let input of doc.getElementsByTagName('input')) {
        if (input.type === 'text') {
            return input;
        }
    }
}

function getHiddenInputFields(doc) {
    const result = [];
    for (let input of doc.getElementsByTagName('input')) {
        if (input.type === 'hidden') {
            result.push(input);
        }
    }
    return result;
}

exec();