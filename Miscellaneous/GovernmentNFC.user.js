// ==UserScript==
// @name         GovernmentNFC
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Scrapestar Government
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include *
// @grant GM_deleteValue
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/School/School.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
     var MTurk=new MTurkScript(40000,200,[],begin_script,"A1TF2W0DUNJVQA",false);
    /* Gov.script_loaded is a map of urls to number loaded there, script total is a map of urls to total number needed there */

    //var MTurk=new MTurkScript(20000,200,[],init_Query,"[TODO]");
    function is_bad_name(b_name)
    {
        return false;
    }



     function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.Phone) my_query.fields[my_query.prefix+"Phone"]=parsed_context.Phone;
            add_to_sheet();
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
            }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !is_bad_name(b_name) && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
        reject("Nothing found");
        return;
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
        my_query.url=result;
             var s;
        var promise=new Promise((resolve,reject) => {
            s=new School({url:my_query.url,city:"",state:"",type:"school",
                              title_str:["Athletic Director","Director of Athletics","Athletics"],
                              debug:true,failed_search_func:function() { console.log("Failed search!!!"); return; },
                             title_regex:[/Athletic|Athletics/i]},resolve,reject);

        });
        promise.then(function(self) {
            console.log("Done promise!!");
            var i,curr,fullname;
            var result=[];
            for(i=0;i<s.contact_list.length;i++) result.push(new PersonQual(s.contact_list[i]));
            var type_lists={"Administration":{lst:[],num:'2'},"IT":{lst:[],num:'1'},"Communication":{lst:[],num:''}},curr_person,x;
            result.sort(cmp_people);
            console.log("result="+JSON.stringify(result));
            var term_map={"FirstName":"first","LastName":"last","Email":"email","Phone":"phone","Title":"title","Link":"url"};
            if(s.phone) my_query.fields[my_query.prefix+"Phone"]=self.phone;
            if(result.length>0) {
                var xt;

                for(xt in term_map) {
                    my_query.fields[my_query.prefix+xt]=result[0][term_map[xt]];
                }
                submit_if_done();
            }

        }).catch(function(error) {
            console.log("Error: "+error); });

    }

    function add_to_sheet() {
        var x,field;
        for(x in my_query.fields) if(field=document.querySelector("input[name='"+x+"']")) field.value=my_query.fields[x];
    }

    function submit_if_done() {
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }



    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0;
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined && Gov!==undefined) { callback(); }
        else if(total_time<2000) {
            console.log("total_time="+total_time);
            total_time+=timeout;
            setTimeout(function() { begin_script(timeout,total_time,callback); },timeout);
            return;
        }
        else { console.log("Failed to begin script"); }
    }

    function cityManager_paste(e) {
        e.preventDefault();
        // get text representation of clipboard
        var i;
        var text = ""+e.clipboardData.getData("text/plain");
        console.log("text="+text);
        var parsed=Gov.parse_data_func(text);
        console.log("parsed="+JSON.stringify(parsed));
        if(parsed.name) {
            var fullname=MTurkScript.prototype.parse_name(parsed.name);
            my_query.fields[my_query.prefix+'FirstName']=fullname.fname;
            my_query.fields[my_query.prefix+'LastName']=fullname.lname;
        }
        if(parsed.phone) my_query.fields[my_query.prefix+'Phone']=parsed.phone;
        if(parsed.email) my_query.fields[my_query.prefix+'Email']=parsed.email;
         if(parsed.title) my_query.fields[my_query.prefix+'Title']=parsed.title;
        submit_if_done();



    }
    function PersonQual(curr) {
        //this.curr=curr;
        var fullname;
        var all_caps_re=/^([A-Z])([A-Z\-]+)$/;
        function fix_allupper_name(match,p1,p2) {
            if(/M/.test(p1)&&p2.length>2&&/C/.test(p2[0])) {
                return p1+p2[0].toLowerCase()+p2[1]+p2.substring(2).toLowerCase(); }
            else {
                return p1+p2.toLowerCase(); }
        }
        var terms=["name","title","phone","email","url"],x;
        for(x of terms) this[x]=curr[x]?curr[x]:"na";
        if(this.title) this.title=this.title.replace(/^[^A-Za-z]+/,"").replace(/[^A-Za-z]+$/,"");
        if(this.name) {

            fullname=MTP.parse_name(curr.name);
            this.first=fullname.fname.replace(all_caps_re,fix_allupper_name);
            this.last=fullname.lname.replace(all_caps_re,fix_allupper_name);
        }
        this.quality=0;
        if(curr.title && /Athletic/i.test(curr.title)) {
            this.type="Administration";
            if(/Director of Athletics|Athletic Director/i.test(curr.title)) this.quality=3;
            else if(/Director/.test(curr.title)) this.quality=2;
            else this.quality=1;
        }
        if(this.email!=="na") this.quality+=6;
        if(/[\d\?]+/.test(this.name)) this.quality=-1;
        var nlp_out=nlp(this.name).people().out('topk');
        if(nlp_out.length>0) this.quality+=2;
    }
    function cmp_people(person1,person2) {
        if(!(person1 instanceof PersonQual && person2 instanceof PersonQual)) return 0;
        if(person2.quality!=person1.quality) return person2.quality-person1.quality;
        else if(person2.email && !person1.email) return 1;
        else if(person1.email && !person2.email) return -1;
        else return 0;

    }

    function init_Query()
    {
        //var dont=document.getElementsByClassName("dont-break-out")[0].href;
        var wT=document.getElementById("WebsiteDataCollection").getElementsByTagName("table")[0];
        var input=document.querySelector("input.form-control");


        my_query={search_str:wT.rows[0].cells[1].innerText.replace(/^.*q\=site:\s*/,"").replace(/^.*q\=\s*/,"").replace(/\+/," "),
                  prefix:'AthleticDir',
fields:{}};
        my_query.prefix=input.name.replace(/FirstName$/,"");
        my_query.fields[my_query.prefix+"Title"]="Athletic Director";
        GM_setClipboard(my_query.url);
        document.querySelector("input[id$='FirstName']").addEventListener("paste",cityManager_paste);

        console.log("query="+JSON.stringify(my_query));
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(my_query.search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });


     /*   var my_promise=new Promise((resolve,reject) => {

            Gov.identify_site(document,window.location.href,resolve,reject);
        });*/
    }


})();