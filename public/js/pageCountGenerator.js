/* global $ */
/* global pageNr */
/* global totalPages */

function addPageElement(element) {
    $("section.page-counter ul.pages").append(element);
}

function addPage(pageNum) {
    addPageElement('<li class="page' + (pageNum == pageNr ? ' current' : '') + '" id="page-' + pageNum + '"><a href="/?page=' + pageNum + '">' + pageNum + '</a></li>');
}

function addDots() {
    addPageElement('<li class="page pageDots">...</li>');
}

function createPages() {
    var lowest = Math.max(2, pageNr - 2);
    var highest = Math.min(totalPages - 1, pageNr + 2);
    
    addPage(1);
    if (lowest - 1 > 1) {
        addDots();
    }
    for (; lowest <= highest; lowest++) {
        addPage(lowest);
    }
    if (totalPages - 1 > highest) {
        addDots();
    }
    addPage(totalPages);
}
