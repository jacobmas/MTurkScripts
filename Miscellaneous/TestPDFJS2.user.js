// ==UserScript==
// @name         TestPDFJS2
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  The GOOD ONE MINE
// @author       You
// @include http://trystuff.com*
// @include http://www.trystuff.com*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect pathwaysprep.org
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/pdf.js/master/dist/pdf.js
// @require https://raw.githubusercontent.com/jacobmas/pdf.js/master/dist/pdf.worker.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

function PDFParser(url) {
    //        console.log("fuck");
    this.url=url;
    //      this.pdf=pdf;
    this.email_list=[];
    this.pdfjsLib = window['pdfjs-dist/build/pdf'];

    // The workerSrc property shall be specified.
    this.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://raw.githubusercontent.com/jacobmas/pdf.js/master/dist/pdf.worker.js';
    console.log("MUck");
}

PDFParser.prototype.parsePDF=function(resolve,reject) {
    var parser=this;
    // Asynchronous download of PDF
    var src={url:this.url,mode:'no-cors'};
    var loadingTask = this.pdfjsLib.getDocument(src);
    loadingTask.promise.then(function(pdf) {
        parser.pdf=pdf;


        var curr_promise=new Promise((resolve,reject) => {

            parser.extractEmails(resolve,reject);
        });
        curr_promise.then(function() {
            console.log("parser.email_list="+parser.email_list);
            resolve(parser.email_list);
        }).catch(function(response) {
            console.log("failed curr_promise,response="+response); });
    })
        .catch(function(response) {
        console.log("error in loadingTask="+JSON.stringify(response));});
}

PDFParser.prototype.extractEmails=function(resolve,reject) {
    var i;
    console.log("in extractEmails");
    var email_promise_list=[];
    var parser=this;
    for(i=1;i<=this.pdf.numPages;i++) {
        email_promise_list.push(this.createEmailPromise(this,this.pdf,i));
    }
    Promise.all(email_promise_list).then(function() { resolve(parser.email_list); }).catch(reject);
}
PDFParser.prototype.createEmailPromise=function(parser,pdf,pageNum) {
    return new Promise((inner_resolve,inner_reject) => {
        pdf.getPage(pageNum).then(function(page) {
            console.log("page=");
            console.log(page);
            parser.parseEmails(page,pageNum,inner_resolve,inner_reject); }).catch(function(response) {
            console.log("Failed getting page "+response); })
    }).then(function(email_list) {
        parser.email_list=parser.email_list.concat(email_list);
    });
}



PDFParser.prototype.parseEmails=function(page,pageNum,resolve,reject) {
    var my_email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%\*]{1,40}(\.[^<>\/()\[\]\\.,;:：\s\*@"\?]{1,40}){0,5}))@((([a-zA-Z\-0-9]{1,30}\.){1,8}[a-zA-Z]{2,20}))/g;
    var email_list=[];
    console.log(page);
    page.getTextContent().then(function(textContent) {
        var curr,match;
        for(curr of textContent.items) {
            if((match=curr.str.match(my_email_re))) email_list=email_list.concat(match);
        }
        resolve(email_list);
    });
};


(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    begin_script();
    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurkScript!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }


    function init_Query() {
        // If absolute URL from the remote server is provided, configure the CORS
        // header on that server.
        var email_list=[];
        var url = 'https://eprint.iacr.org/2016/589.pdf';
        //  var url = 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf';
        var parser=new PDFParser(url);
        console.log("parser="+JSON.stringify(parser));
        console.log(parser);

        // Loaded via <script> tag, create shortcut to access PDF.js exports.
        var pdf_promise=new Promise((resolve,reject) => {
            parser.parsePDF(resolve,reject) })
        .then(function(result) {
            console.log("email result="+JSON.stringify(result)); })
        .catch(function(response) {
            console.log("Failed at parsing PDF, response="+response); });

    }

})();