// ==UserScript==
// @name         YahooAnswers
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Parse Yahoo Answers
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
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
// @connect answers.yahoo.com
// @connect yahoo.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,200,[],begin_script,"A1K41XA3QY05IW",true);
    var MTP=MTurkScript.prototype;
    function longestCommonSubsequence(set1, set2) {
         // Init LCS matrix.
        const lcsMatrix = Array(set2.length + 1).fill(null).map(() => Array(set1.length + 1).fill(null));

        // Fill first row with zeros.
        for (let columnIndex = 0; columnIndex <= set1.length; columnIndex += 1) {
            lcsMatrix[0][columnIndex] = 0;
        }

        // Fill first column with zeros.
        for (let rowIndex = 0; rowIndex <= set2.length; rowIndex += 1) {
            lcsMatrix[rowIndex][0] = 0;
        }

        // Fill rest of the column that correspond to each of two strings.
        for (let rowIndex = 1; rowIndex <= set2.length; rowIndex += 1) {
            for (let columnIndex = 1; columnIndex <= set1.length; columnIndex += 1) {
                if (set1[columnIndex - 1] === set2[rowIndex - 1]) {
                    lcsMatrix[rowIndex][columnIndex] = lcsMatrix[rowIndex - 1][columnIndex - 1] + 1;
                } else {
                    lcsMatrix[rowIndex][columnIndex] = Math.max(
                        lcsMatrix[rowIndex - 1][columnIndex],
                        lcsMatrix[rowIndex][columnIndex - 1],
                    );
                }
            }
        }

        // Calculate LCS based on LCS matrix.
        if (!lcsMatrix[set2.length][set1.length]) {
            // If the length of largest common string is zero then return empty string.
            return [''];
        }

        const longestSequence = [];
        let columnIndex = set1.length;
        let rowIndex = set2.length;

        while (columnIndex > 0 || rowIndex > 0) {
            if (set1[columnIndex - 1] === set2[rowIndex - 1]) {
                // Move by diagonal left-top.
                longestSequence.unshift(set1[columnIndex - 1]);
                columnIndex -= 1;
                rowIndex -= 1;
            } else if (lcsMatrix[rowIndex][columnIndex] === lcsMatrix[rowIndex][columnIndex - 1]) {
                // Move left.
                columnIndex -= 1;
            } else {
                // Move up.
                rowIndex -= 1;
            }
        }

        return longestSequence;
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function add_to_sheet() {
        var x,field,radios,selects;
        for(x in my_query.fields) if(field=document.getElementsByName(x)[0]) field.value=my_query.fields[x];
        for(x in my_query.radios) {
            if(radios=document.getElementsByName(x)) {
                //console.log("x="+x+",radios.length="+radios.length+"my_query.radios[x]="+my_query.radios[x] );
                radios[my_query.radios[x]].checked=true;
            }
        }
        for(x in my_query.selects) if(selects=document.getElementsByName(x)[0]) selects.value=my_query.selects[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

    function parse_ya_then() {
        submit_if_done();
    }

    function parse_user(doc,url,resolve,reject,answer) {
        console.log("parse_user,url="+url);
        var pts=doc.querySelector("#div-pt .stat-count"),ba=doc.querySelector("#div-ba .stat-count");
        var answ=doc.querySelector("#div-answ .stat-count")
        if(pts) my_query.fields.u_point=pts.innerText.replace(/,/g,"");
        if(ba) my_query.fields.n_best=ba.innerText.replace(/%/g,"");
        if(answ) my_query.fields.u_ac=answ.innerText.replace(/,/g,"");;
        console.log("my_query.fields="+JSON.stringify(my_query.fields));
        resolve("");


    }
    function parse_good_answer(doc,url,resolve,reject,answer) {
        console.log("In parse_good_answer,url="+url);
        var reftext=answer.querySelector(".ya-ans-ref-text");

        var links=answer.querySelectorAll("a"),in_count=0,ext_count=0,i;
        var img,rating,comments,comment_date,now_date,years,ext_link,uname;
        if(reftext) console.log("Source: "+reftext.innerHTML);
        now_date=new Date();
        let comment_time=answer.querySelector(".ya-localtime");
        my_query.radios.d_best=answer.querySelector(".ya-ba-title")?1:0;
        my_query.fields.d_upvotes=answer.querySelector("[itemprop='upvoteCount']").innerText;
        my_query.fields.d_downvotes=answer.querySelector(".tdownwrap .count").innerText;
        img=answer.querySelector(".Pt-15 div img");
        if(img && (rating=img.alt.match(/^[\d]+/))) my_query.radios.d_rating=parseInt(rating);
        else my_query.radios.d_rating=0;
        var text=answer.querySelector("[itemprop='text']").innerText;
        comments=answer.querySelectorAll(".ya-comments-holder div .comment-tile");
        my_query.fields.r_cc=comments.length;
        if(comment_time) {
            comment_date=new Date(1000*parseInt(comment_time.dataset.ts));
            years=now_date.getFullYear()-comment_date.getFullYear();
            if(comment_date.getMonth() > now_date.getMonth() ||
               (comment_date.getMonth()===now_date.getMonth() && comment_date.getDate() > now_date.getDate())) years--;
            if(years>14) years=14;
            my_query.selects.r_aage=years;
        }
        for(i=0;i<links.length;i++) {
            links[i].href=MTP.fix_remote_url(links[i].href,url);
            if(/answers\.yahoo\.com\/question\//.test(links[i].href) && !/^http/.test(links[i].innerText)) in_count++;
            else if(!/answers\.yahoo\.com\//.test(links[i].href) && !/^http/.test(links[i].innerText)) ext_count++;
        }
        let regex_int=/( www\.|http:)[^\s\n]+/g,link_match;
        link_match=answer.innerText.match(regex_int);
        if(link_match) {
            for(i=0;i<link_match.length;i++) {
                if(/answers\.yahoo\.com\/question\//.test(link_match[i])) in_count++;
                else if(!/answers\.yahoo\.com\//.test(link_match[i])) ext_count++;
            }
        }

        my_query.fields.s_ilc=in_count;
        my_query.fields.s_elc=ext_count;
        if(answer.querySelector(".uname")) {
            console.log("User:"+answer.querySelector(".uname").innerText);
            ext_link=MTP.fix_remote_url(answer.querySelector(".uname").href,url);
            var promise=MTP.create_promise(ext_link,parse_user,resolve,reject,answer);
        }
        else {
            resolve("");
        }



    }

    function parse_yahoo_answers(doc,url,resolve,reject) {
        var deletes=doc.querySelector("#ya-deleted-questions");
        if(deletes) { console.log("This question does not exist or is under review.");
                     document.getElementsByName("feedback")[0].value="This question does not exist or is under review.";
                     document.getElementsByName("feedback")[0].scrollIntoView();
                     return;
                    }
        document.getElementById("n_prof-0").parentNode.parentNode.scrollIntoView();

        var answers=doc.querySelectorAll("[itemtype='https://schema.org/Answer']"),text,i;
        var q=doc.querySelector("[itemtype='https://schema.org/Question']");
        var q_name=q.querySelector("[itemprop='name']"),q_text=q.querySelector("[itemprop='text']");
//        if(q_name) console.log("Title:"+q_name.innerText);
        if(q_name) console.log(q_name.innerText+"\n"+(q_text?q_text.innerText:""));
        for(i=0;i<answers.length;i++) {
            text=answers[i].querySelector("[itemprop='text']");

            if(text.innerText.indexOf(my_query.answer)!==-1 || (
            (longestCommonSubsequence(text.innerText,my_query.answer).length>(3./4.)*text.innerText.length))
            ) {
                console.log("("+i+"): "+text.innerText);
                parse_good_answer(doc,url,resolve,reject,answers[i]);
                return;
            }
        }
        var pages=doc.querySelectorAll("#ya-qn-pagination a");
        for(i=0;i<pages.length;i++) {
            pages[i].href=MTP.fix_remote_url(pages[i].href,url);
            if(/next/.test(pages[i].innerText)) {
                let promise=MTP.create_promise(pages[i].href,parse_yahoo_answers,resolve,reject);
                return;
            }
        }
        console.log("ANSWER NOT FOUND");
        document.getElementsByName("feedback")[0].value="Answer not present.";
        document.getElementsByName("feedback")[0].scrollIntoView();
    }

    function init_Query()
    {
        console.log("in init_query");
        var i;
        var inps=document.querySelectorAll("crowd-input,input");
        inps.forEach(function(elem) { elem.required=false; });
        var a=document.querySelector("form a");
        var answer=document.querySelector(".answer").innerText.replace(/^\"(.*)\"$/,"$1");
        console.log("MOOOO");
        my_query={url:a.href,answer:answer,
                  radios:{d_best:0,d_rating:0,n_prof:1,n_parent:1,n_recc:1},
                  selects:{r_aage:""},
                  fields:{d_upvotes:"",d_downvotes:"",r_cc:"",s_ilc:"",s_elc:"",
                          n_best:"",u_point:"",u_ac:"",feedback:""
                              },done:{},submitted:false};
       // console.log("answer:\n"+my_query.answer);
        var promise=MTP.create_promise(my_query.url,parse_yahoo_answers,parse_ya_then);
 
    }

})();