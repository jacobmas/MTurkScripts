// ==UserScript==
// @name         mlamba
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  School stuff
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/bff939c2573e93d58b56d3cb8e3b2e2763d3bd58/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/c35c9a18a12ebc3a0d906bfc4728cb056f818e93/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/f5ad669e05891b234a9a1cd7cec665ff098f3438/School/School.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A2N06TMNR7CQQJ",true);
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
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); 
				
				if(parsed_context.url&&!MTP.is_bad_url(parsed_context.url,bad_urls,-1)) {
                resolve(parsed_context.url);
                return;
            }
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
					if(parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
                resolve(parsed_lgb.url);
                return;
            }
					
					}
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
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
        var is_done=true,x,is_done_dones=x;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }



School.prototype.parse_bb_swpage=function(doc,url,resolve,reject,self) {
	console.log("parse_bb_swpage, url=",url,"doc=",doc);
	var name=doc.querySelector("#about-teacher-bio h1");
	var curr_contact={};
	var staffemail=doc.querySelector("[id^='emailLabel']");
	var staffphone=doc.querySelector("[id^='phoneLabel']");
    var email;

	var match;
	if(name) curr_contact.name=name.innerText.trim();
    else if((name=doc.querySelector(".ui-widget h1")) && /\s-\s/.test(name.innerText.trim())) {
        console.log("Found name=",name);
        let split=name.innerText.split(/\s-\s/);
        curr_contact.name=split[0].trim().replace(/(.*),\s*(.*)/,"$2 $1");
        curr_contact.title=split[1].trim();
    }
    else if((name=doc.querySelector(".ui-widget h1"))) {
        curr_contact.name=name.innerText.trim();
    }

	if(staffemail&&(match=staffemail.innerHTML.match(/swrot13\(\'([^\']+)\'/))) {
			curr_contact.email=MTP.swrot13(match[1].toLowerCase());
		}
    else if((email=doc.querySelector("a[href^='mailto:']")) && /@/.test(email.innerText.trim())) {
        curr_contact.email=email.innerText.trim();
    }
	if(staffphone) curr_contact.phone=staffphone.innerText;
    console.log("curr_contact=",curr_contact);
	if(curr_contact.name && curr_contact.email) {
		self.contact_list.push(curr_contact);
	}
	resolve("");
};


    function PersonQual(curr,s) {
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
       // console.log("pre-terms");

        for(x of terms) {
            try { this[x]=curr[x]?curr[x].trim():"na"; }
            catch(e) { }
        }
         //       console.log("post-terms");

       // if(this.title) this.title=this.title.replace(/^[^A-Za-z]+/,"").replace(/[^A-Za-z]+$/,"");
        if(this.name&&curr.name) {
            this.name=this.name.replace(/[\n\t]+/g," ");
            this.name=this.name.replace(/^([^,]*),\s*(.*)$/,"$2 $1");
            curr.name=curr.name.replace(/^([^,]*),\s*(.*)$/,"$2 $1");
            let appellation=this.name.match(/^(Mr\.|Mrs\.|Dr\.|Ms\.|Miss)\s/);
            if(appellation) {
                this.appellation=appellation[1];
            }
            else {
                this.appellation="";
            }


            fullname=MTP.parse_name(curr.name.trim());

            if(!fullname||!fullname.fname||!fullname.lname) {

                this.quality=0;
                return;
            }
            this.first=fullname.fname.replace(all_caps_re,fix_allupper_name);
            this.last=fullname.lname.replace(all_caps_re,fix_allupper_name);
        }
        this.quality=0;
        if(curr.title && /Math|Computer Science|Engineering|Programming|Teacher|Grade/i.test(curr.title)) {
            this.type="Administration";
            if(/Computer Science|Engineering|Programming/.test(curr.title)) this.quality=3;
            else if(/Math/.test(curr.title)) this.quality=2;
            else this.quality=1;
        }
        if(this.email!=="na" && /@/.test(this.email)) this.quality+=15;

        if(/[\d\?]+/.test(this.name)) this.quality=-1;
        var nlp_out=nlp(this.name).people().out('topk');
        if(nlp_out.length>0) this.quality+=2;
       /*if(this.email==="na" && (s.page_type==="none"&&(s.phone==="na"))) {
            this.quality=0;
            return;
        }*/
    }
    function cmp_people(person1,person2) {
        if(!(person1 instanceof PersonQual && person2 instanceof PersonQual)) return 0;
        if(person2.quality!=person1.quality) return person2.quality-person1.quality;
        else if(person2.email && !person1.email) return 1;
        else if(person1.email && !person2.email) return -1;
        else return 0;

    }

    function failed_search_func() {
        GM_setValue("returnHit",true);
    }

    function post_people(result,s) {
        my_query.fields.schoolWebsite=s.base||s.url;

        console.log("In post_people, result=",result);
        var r;
        console.log("Gov.email_list=",Gov.email_list);
        var out_str="";
        for(r of result) {
            if(r.quality>0) {
                out_str=out_str+my_query.schoolid+"\t"+r.appellation+"\t"+r.first+"\t"+r.last+"\t"+r.title.replace(/\n|\t/g," ")+"\t"+r.email+"\n";
            }

        }
        console.log("out_str=\n",out_str);
        add_to_sheet();
    }

    function init_Query()
    {
        var checkboxes=document.querySelectorAll("crowd-checkbox");
        checkboxes.forEach((c) => { c.click(); });
        add_to_sheet();
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
       var div=document.querySelector("crowd-form div div div");
        var p=div.querySelectorAll("p");
        var citystate=p[3].innerText.trim().split(",");

        var second_div=document.querySelectorAll("crowd-form span > div > div")[3];
        var p2 = second_div.querySelectorAll("p")[1];


        my_query={name:p[1].innerText.trim(),street:p[2].innerText.trim(),
                  city:citystate[0].trim(), state:citystate[1].trim().toUpperCase(),
                  schoolid: p2.innerText.replace(/^[^:]*:\s*/,"").trim(),
                  fields:{},done:{},
		  try_count:{"query":0},
		  submitted:false};
        var s;
        if(!/School|Academy/i.test(my_query.name)) my_query.name=my_query.name+" School";

        console.log("my_query="+JSON.stringify(my_query));
       var promise=new Promise((resolve,reject) => {
            s=new School({name:my_query.name,street:my_query.street,city:my_query.city,state:my_query.state,type:"school",
                              title_str:["Teacher","Principal","Grade",""],
                              debug:true,failed_search_func:failed_search_func,
                             title_regex:[/.*/i]},resolve,reject);

        });
        promise.then(function(self) {
            var i,curr,fullname;
            console.log("Finished, s.page_type=",s.page_type);
            var result=[];
            for(i=0;i<s.contact_list.length;i++) result.push(new PersonQual(s.contact_list[i],s));

            var type_lists={"Administration":{lst:[],num:'2'},"IT":{lst:[],num:'1'},"Communication":{lst:[],num:''}},curr_person,x;
            result.sort(cmp_people);
            console.log("Finished");

            // For ZachLatta only
            post_people(result,s);
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