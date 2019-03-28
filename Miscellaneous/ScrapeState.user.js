// ==UserScript==
// @name         ScrapeState
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrape State sites for principals etc
// @author       You
// @include http://trystuff.com/*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    //var MTurk=new MTurkScript(20000,200,[],begin_script,"[TODO]");
    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTP!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }
    function scrape_then(result) {
        console.log("Done scraping");
    }
    function scrape_SD_top(doc,url,resolve,reject) {
        var urls=doc.querySelectorAll(".schl a"),i;
        for(i=0;i<urls.length;i++) my_query.dist_urls.push(urls[i].href.replace("http://trystuff.com/","https://doe.sd.gov/ofm/"));
        console.log("my_query.dist_urls="+JSON.stringify(my_query.dist_urls));
       // my_query.div.innerHTML=JSON.stringify(my_query.dist_urls);
        my_query.curr_url=-1;
        begin_url_scrape_SD(resolve,reject);
    }
    function begin_url_scrape_SD(resolve,reject) {
        my_query.curr_url++;
        if(my_query.curr_url>=my_query.dist_urls.length) {
            resolve("");
            return; }
        var promise=MTP.create_promise(my_query.dist_urls[my_query.curr_url],scrape_district_SD,begin_url_scrape_SD);
    }
    function scrape_district_SD(doc,url,resolve,reject) {
        console.log("In scrape_district, url="+url);
        var promise_list=[];
        var district=doc.getElementById("lblDistrName");
        var urls=doc.querySelectorAll(".school a"),i;
        for(i=0;i<urls.length;i++) {
            promise_list.push(MTP.create_promise(urls[i].href.replace("http://trystuff.com/","https://doe.sd.gov/ofm/"),scrape_school_SD,MTP.my_then_func));
        }
        Promise.all(promise_list).then(function(result) {
            console.log("Done district: "+district);
            resolve();
        });
    }
    function scrape_school_SD(doc,url,resolve,reject) {
        console.log("In scrape_school,url="+url);
        var district=doc.getElementById("lblDistrName"),school=doc.getElementById("lblSchoolName");
        var out_str=doc.getElementById("lblDistrName").innerText.trim()+","+doc.getElementById("lblSchoolName").innerText.trim()+","+
            doc.getElementById("lblAddr").innerText.trim()+","+doc.getElementById("lblCity").innerText.trim()+","+
            doc.getElementById("lblState").innerText.trim()+","+doc.getElementById("lblZip").innerText.trim();
        var contact=doc.querySelectorAll(".distrcontact"),name=doc.querySelectorAll(".distrname"),phone=doc.querySelectorAll(".distrphone"),
            email=doc.querySelectorAll(".distremail"),i;
        var contact_str;
        for(i=0;i<contact.length;i++) {

            contact_str=name[i].innerText.trim()+","+contact[i].innerText.trim()+","+phone[i].innerText.replace(/^Ph:\s*/,"").trim()+","+email[i].innerText.trim();
            my_query.div.innerHTML=my_query.div.innerHTML+out_str+","+contact_str+"<br>";
        }
       resolve();
    }
    function scrape_TN(doc,url,resolve,reject) {
        var urls=doc.querySelectorAll("a"),i;
        var table=doc.querySelector("#table1");
        for(i=0;i<urls.length;i++) {
            if(/CreateSchoolList\.asp.*status\=A/.test(urls[i].href)) {
                my_query.dist_urls.push(urls[i].href.replace("http://trystuff.com/","https://k-12.education.tn.gov/")); }
        }
        console.log("my_query.dist_urls="+JSON.stringify(my_query.dist_urls));
       // my_query.div.innerHTML=JSON.stringify(my_query.dist_urls);
        my_query.curr_url=-1;
       begin_url_scrape_TN(resolve,reject);
    }
    function begin_url_scrape_TN(resolve,reject) {
        my_query.curr_url++;
        if(my_query.curr_url>=my_query.dist_urls.length) {
            resolve("");
            return; }
        var promise=MTP.create_promise(my_query.dist_urls[my_query.curr_url],scrape_district_TN,begin_url_scrape_TN);
    }
    function scrape_district_TN(doc,url,resolve,reject) {
        console.log("In scrape_district_TN, url="+url);
        var i,table=doc.querySelector("#table1"),row,left,right,split_left,split_right,match,x,j;
        var curr_contact={district:"",school:"",name:"",title:"",phone:"",email:"",url:"",address:"",city:"",state:"",zip:""};
        var curr_contact_pos=["district","school","address","city","state","zip","name","title","phone","email","url"];
        var out_str="";
        for(i=1;i<table.rows.length;i++) {

            out_str="";
            curr_contact={district:"",school:"",name:"",title:"",phone:"",email:"",url:"",address:"",city:"",state:"",zip:""};
            row=table.rows[i];
             console.log("row.cells.length="+row.cells.length);
            if(row.length<6) continue;
            left=row.cells[4];
            split_left=left.innerText.replace(/\t/g,"").replace(/\n\n+/g,"\n").trim().split("\n");
            console.log("split_left="+JSON.stringify(split_left));
            if(split_left.length>0) curr_contact.school=split_left[0].trim();
            if(split_left.length>1) { curr_contact.name=split_left[1].replace(/^(Dr|Mr|Mrs|Ms)\.\s*/,"").trim(); curr_contact.title="Principal"; }
            if(split_left.length>2) curr_contact.address=split_left[2].trim();
            if(split_left.length>3 && (match=split_left[3].trim().match(/^(.*)\s([A-Z]{2})\s([\-\d]+)$/))) {
                curr_contact.city=match[1];
                curr_contact.state=match[2];
                curr_contact.zip=match[3];
            }
            if(split_left.length>4 && phone_re.test(split_left[4].trim())) curr_contact.phone=split_left[4].trim();
            right=row.cells[5];
            split_right=right.innerText.replace(/\t/g,"").replace(/\n\n+/g,"\n").trim().split("\n");
            console.log("split_right="+JSON.stringify(split_right));
            if(split_right.length>1) curr_contact.district=split_right[1].trim();
            if(split_right.length>2 && (match=split_right[2].match(email_re))) { curr_contact.email=split_right[2].trim(); }
            else if(split_right.length===3) { curr_contact.url=split_right[2].trim(); }
            if(split_right.length>3) curr_contact.url=split_right[3].trim();
            for(j=0;j<curr_contact_pos.length;j++) out_str=out_str+(out_str.length>0?";":"")+curr_contact[curr_contact_pos[j]].trim();
            console.log("out_str="+out_str);
            my_query.div.innerHTML=my_query.div.innerHTML+out_str+"<br>";
        }
        resolve();
    }


    function init_Query()
    {
        console.log("in init_query");
        var div=document.createElement("div");
        div.style="margin: 10px";
        div.innerHTML="";
        document.body.appendChild(div);
        my_query.div=div;
        my_query.dist_urls=[];
        var scrape_list={"SD":{url:"https://doe.sd.gov/ofm/edudir.aspx",begin:scrape_SD_top},
                        "TN":{url:"https://k-12.education.tn.gov/sde/CreateDistrictList.asp?status=A&disttype=999",begin:scrape_TN}};
        var state="TN";
        var promise=MTP.create_promise(scrape_list[state].url,scrape_list[state].begin,scrape_then);

    }
    begin_script();

})();