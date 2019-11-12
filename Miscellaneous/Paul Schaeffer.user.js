// ==UserScript==
// @name         Paul Schaeffer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  One off schools crape
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_deleteValue
// @grant GM_addValueChangeListener
// @grant GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @grant GM_cookie
// @grant GM.cookie
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/2d7a67622f597ff5f59d12a4d8b8e12cb169925c/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/0ea1005fce56ca343ec188cb2b37e51963bcbe75/School/Schools.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/School/School.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(40000,750+(Math.random()*500),[],begin_script,"AFN2RI5XBM9LK",true);
    var MTP=MTurkScript.prototype;
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
                console.log("parsed_context="+JSON.stringify(parsed_context)); } 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : '';
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTurkScript.prototype.is_bad_url(b_url, bad_urls) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve(b_url)||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        reject("Nothing found");
    }

    /* Search on bing for search_str, parse bing response with callback */
    function query_search(search_str, resolve,reject, callback,type,filters) {
        console.log("Searching with bing for "+search_str);
        if(!filters) filters="";
        var search_URIBing='https://www.bing.com/search?q='+
            encodeURIComponent(search_str)+"&filters="+filters+"&first=1&rdr=1";
        GM_xmlhttpRequest({method: 'GET', url: search_URIBing,
                           onload: function(response) { callback(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
    }

    /* Following the finding the district stuff */
    function query_promise_then(result) {
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
        var x,field;
        for(x in my_query.fields) {
            if((MTurk.is_crowd && (field=document.getElementsByName(x)[0])) ||
               (!MTurk.is_crowd && (field=document.getElementById(x)))) field.value=my_query.fields[x];
        }
    }

    function submit_if_done() {
        var is_done=true,x,is_done_dones;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed");
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        }
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
            if(!fullname.fname||!fullname.lname) {
                this.quality=-1;
                return;
            }
            this.first=fullname.fname.replace(all_caps_re,fix_allupper_name);
            this.last=fullname.lname.replace(all_caps_re,fix_allupper_name);
        }
        this.quality=0;
        if(curr.title && /Principal|Director/i.test(curr.title)) {
            this.type="Administration";
            if(/Principal/i.test(curr.title)) this.quality=3;
            else if(/Director/i.test(curr.title)) this.quality=2;
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
        console.log("in init_query");
        var i;
        var strong_re=/^(.*?) located in ([^,]*),\s*(.*)$/,match;
        var strong=document.querySelector("form strong");
        match=strong.innerText.trim().match(strong_re);


        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        //var dont=document.getElementsByClassName("dont-break-out");
        my_query={name:match[1].trim(),
                  city:match[2],state:match[3],
                  fields:{website:"",email:"",name:""},
                  done:{school1:false},
		  try_count:{"query":0},
		  submitted:false};
        my_query.name=my_query.name.replace(/^(St [A-Za-z]+)s /i,"$1 ");
        console.log("my_query="+JSON.stringify(my_query));
        var s;
        var promise1=new Promise((resolve,reject) => {
            s=new School({name:my_query.name,city:my_query.city,state:my_query.state,type:"school",
                              title_str:["Principal"],
                              debug:true,url_only:false,
                             title_regex:[/Principal|Administrator|Head of School|Director|Head|Teacher/i]},resolve,reject);


        });
        promise1.then(function(response) {
            console.log("Done promise1");
            my_query.fields.website=s.url;
             my_query.done.school1=true;
            var person_list=[];
            for(i of s.contact_list) {
                person_list.push(new PersonQual(i));
            }
            person_list.sort(cmp_people);
            console.log("person_list="+JSON.stringify(person_list));
            if(person_list.length>0&&person_list[0].quality>=6) {
                my_query.fields.name=person_list[0].name;
                my_query.fields.email=person_list[0].email;

               
            }
            submit_if_done();


        })
        .catch(function(response) {
            console.log("response="+response);
            GM_setValue("returnHit"+MTurk.assignment_id,true);
            return;
        });
        /*var promise2=Schools.init_Schools({type:"school",name:my_query.name,city:my_query.city,state:my_query.state,state_dir:true,
                                           title_regex:/Principal|Administrator/});
        promise2.then(function(response) {
            console.log("Done promise2, Schools.contact_list="+JSON.stringify(Schools.contact_list));
            //console.log("Schools="+JSON.stringify(Schools));
             my_query.done.school2=true;
            if(Schools.contact_list.length>0&&Schools.contact_list[0].email!==undefined) {

                my_query.fields.email=Schools.contact_list[0].email;
               
                
            }
            submit_if_done();
        });*/

	
      
    }

})();
