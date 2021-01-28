// ==UserScript==
// @name         Talia Trambert
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  New script
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/School/School.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A1T1JVCBDQVXRR",true);
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
        var is_done=true,x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
    }

     function failed_search_func_latta(response) {
                console.log("Failed response");
         GM_setValue("returnHit"+MTurk.assignment_id,true);
    }

    /* LinkQual ranks link quality */
    function PersonQual(curr) {
        //this.curr=curr;
        var fullname;
        console.log("In personQual, curr="+curr);
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
            if(fullname.fname && fullname.lname) {
                this.first=fullname.fname.replace(all_caps_re,fix_allupper_name);
                this.last=fullname.lname.replace(all_caps_re,fix_allupper_name);
            }
        }
        this.quality=0;
        if(curr.title && /^(Dean|Principal)/i.test(curr.title)) this.quality=8;
        if(curr.title && /^(Vice|Assistant) Principal/i.test(curr.title)) this.quality=6;

        if(curr.title && /Principal|Dean/i.test(curr.title)) {
            if(/Assistant|Vice/.test(curr.title)) this.quality=1;
            else this.quality=2;
        }
        if(this.email!=="na") this.quality+=6;
        if(/[\d\?]+/.test(this.name)) this.quality=-1;

        var nlp_out=nlp(this.name).people().json();
        console.log("nlp_out=");
        console.log(nlp_out);
        if(nlp_out.length>0) this.quality+=2;
        if(this.email==="na") this.quality=0;
        if(/School/i.test(this.name)) this.quality=0;
        if(/district|mount/i.test(this.first)) this.quality=0;
        if(/Middle|Elementary|Secretary/i.test(this.title)) this.quality=0;
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
        var s;
        var name="",add="";
        var p=document.querySelectorAll("form div div div p");
        var name_add=p[2].innerText.trim().replace(/^[^:]*:\s*/,"");
        var name_split_re=/^(.*)\s([0-9\-]*\s.*)$/,match;
        let name_split_re2=/^(.* HS)\s(.*)$/;
        if((match=name_add.match(name_split_re))) {
            add=new Address(match[2]);
            name=match[1];
        }
        else if((match=name_add.match(name_split_re2))) {
            add=new Address(match[2]);
            name=match[1];
        }
        my_query={name:name,address:add,fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};
        my_query.name=my_query.name.replace(/ HS(\s|$)/," High School$1")
        .replace(/ JSHS(\s|$)/," Junior Senior High School$1")
        .replace(/ SHS(\s|$)/," Senior High School$1");

        my_query.name=name_add.replace(/ HS(\s|$)/," High School$1").replace(/ JSHS(\s|$)/," Junior Senior High School$1")
        .replace(/ SHS(\s|$)/," Senior High School$1");;

	console.log("my_query="+JSON.stringify(my_query));
         var promise=new Promise((resolve,reject) => {
            s=new School({name:my_query.name,city:"",state:"",type:"school",
                              title_str:["Principal","Dean"],
                              debug:true,failed_search_func:failed_search_func_latta,
                             title_regex:[/Principal|Dean/i]},resolve,reject);

        });
        promise.then(function(self) {
            var i,curr,fullname;
            var result=[];
            for(i=0;i<s.contact_list.length;i++) result.push(new PersonQual(s.contact_list[i]));
            var type_lists={"Administration":{lst:[],num:'2'},"IT":{lst:[],num:'1'},"Communication":{lst:[],num:''}},curr_person,x;
            result=result.filter(person => person.quality > 0);

            result.sort(function(a,b) { return a.email-b.email; });
            console.log("result="+JSON.stringify(result));
            console.log("result.length="+result.length);
            for(i=result.length-2;i>=0;i--) {
                if(result[i+1].email===result[i].email) {
                    result.splice(i+1,1);
                }
            }
            console.log("result.length="+result.length);

            result.sort(cmp_people);
           console.log(s);
            var field_types=["Principal","Ap1","Ap2","Ap3"];
            my_query.fields.schoolUrl=s.url;

            for(i=0;i<field_types.length;i++) {
                document.querySelector("[name='email"+field_types[i]+"']").required=false;
                document.querySelector("[name='firstName"+field_types[i]+"']").required=false;
                document.querySelector("[name='lastName"+field_types[i]+"']").required=false;
                document.querySelector("[name='contactTitle"+field_types[i]+"']").required=false;


                is_good=true;
            }


            // email, firstName, lastName, contactTitle
            var is_good=false;

            for(i=0;i<field_types.length&&i<result.length;i++) {
                if(result[i].quality<=0) break;
                my_query.fields["email"+field_types[i]]=result[i].email;
                my_query.fields["firstName"+field_types[i]]=result[i].first;
                my_query.fields["lastName"+field_types[i]]=result[i].last;
                my_query.fields["contactTitle"+field_types[i]]=result[i].title;

                is_good=true;
            }


            if(is_good) {
                submit_if_done();
            }
            else {
                console.log("NOthing");
                GM_setValue("returnHit"+MTurk.assignment_id,true);
            }

            // For ZachLatta only
          /*  if(result.length>0) {
                curr=result[0];
                console.log("curr="+JSON.stringify(curr));
                fullname=MTP.parse_name(curr.name);
                my_query.fields.first_name=fullname.fname;
                my_query.fields.last_name=fullname.lname;
                my_query.fields.email=curr.email;

            }

            console.log("result="+JSON.stringify(result));*/

            //submit_if_done();
        }).catch(function(error) {
            console.log("Error: "+error); });
    }

})();