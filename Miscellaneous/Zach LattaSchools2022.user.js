// ==UserScript==
// @name         Zach LattaSchools2022
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  ZachLatta2022
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
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/School/School.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(120000,200,[],begin_script,"A281MMTK4S393C",true);
    var MTP=MTurkScript.prototype;

    School.prototype.parse_bb_swpage=function(doc,url,resolve,reject,self) {
	console.log("parse_bb_swpage, url=",url,"doc=",doc);
	var name=doc.querySelector("#about-teacher-bio h1");
	var curr_contact={};
	var staffemail=doc.querySelector("[id^='emailLabel']");
	var staffphone=doc.querySelector("[id^='phoneLabel']");
        var stafftitle="";
    var email;

	var match;
	if(name) curr_contact.name=name.innerText.trim();
    else if((name=doc.querySelector(".ui-widget h1")) && /\s-\s/.test(name.innerText.trim())) {
        console.log("Found name=",name);
        let split=name.innerText.split(/\s-\s/);
        curr_contact.name=split[0].trim().replace(/(.*),\s*(.*)/,"$2 $1");
        curr_contact.title=split[1].trim();
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


    /* LinkQual ranks link quality */
    function LinkQual(href,innerText) {
        this.href=href;
        this.innerText=innerText;
        this.quality=0;
        if(/(Staff|Employee) Directory/.test(innerText)) this.quality=4;
        else if(/Directory/.test(innerText)) this.quality=3;
        else if(/Staff/.test(innerText)) this.quality=2;
    }


    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
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
        var query={type:"district",name:my_query.short_name,
                   title_regex:/Superintendent|Administrator|CTO|Technology|IT |Information|Communications|PR|Public Relations/,
                   state_dir:false,city:my_query.city,state:my_query.state};
        my_query.url=result;
        var promise=MTP.create_promise(my_query.url,Schools.init_SchoolSearch,parse_school_then,MTP.my_catch_func,query);
    }
    function parse_school_then(result) {
        console.log("result="+JSON.stringify(result));
    }

    function begin_script(timeout,total_time,callback) {
        if(timeout===undefined) timeout=200;
        if(total_time===undefined) total_time=0; 
        if(callback===undefined) callback=init_Query;
        if(MTurk!==undefined) {

                callback();
        }
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
        console.log("my_query.fields=",my_query.fields);
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) {
            MTurk.check_and_submit();
            document.querySelector('crowd-button[data-testid="crowd-submit"]').click();
        }
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function paste_data(e) {
        e.preventDefault();
        var target_type=e.target.id.replace(/1$/,"");
        var term_list=["","Tech Coordinator","Superintendent"];
        var text = e.clipboardData.getData("text/plain");
        var ret=Gov.parse_data_func(text),fullname;
        console.log("ret="+JSON.stringify(ret));
        var term_map={"title":"1","first":"2","last":"3",phone:"4",email:"5"},x;
        if(ret) {
            if(ret.name) {
                fullname=MTP.parse_name(ret.name);
                ret.first=fullname.fname;
                ret.last=fullname.lname;
            }
            if(ret.phone) ret.phone=ret.phone.replace(/^([\d]{3}\))/,"($1");
            if(ret.email) ret.email=ret.email.replace(/^20/,"");
            if(ret.title===undefined||ret.title.length===0)  {
                let num=target_type.replace(/^f/,"").replace(/^$/,"0");
                console.log("target_Type="+num+", elem="+parseInt(num));
                ret.title=term_list[parseInt(num)];
            }
            for(x in term_map) {
                if(ret[x]!==undefined) document.getElementById(target_type+term_map[x]).value=ret[x];
            }
        }
        else e.target.value=text;
    }
    function paste_name(e) {
        e.preventDefault();
        var target_type=e.target.id.replace(/2$/,"");
        var text = e.clipboardData.getData("text/plain");
        var ret=MTP.parse_name(text.trim());
        var term_map={"fname":"2","lname":"3"},x;
        if(ret&&ret.fname) {

            for(x in term_map) {
                if(ret[x]!==undefined) {
                    my_query.fields[target_type+term_map[x]]=ret[x];
                    document.getElementById(target_type+term_map[x]).value=ret[x];
                }
            }
        }
        else e.target.value=text;
    }

   

    /* LinkQual ranks link quality */
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

            this.first=fullname.fname?fullname.fname.replace(all_caps_re,fix_allupper_name):"";
            this.last=fullname.lname?fullname.lname.replace(all_caps_re,fix_allupper_name):"";
        }
        this.quality=0;

        if(this.email&&this.email!=="na"&&/@/.test(this.email)) this.quality+=6;
        else {
            this.quality=0;
            return;
        }
        if(curr.title && /Computer Science|Engineering|Programming|Technology/i.test(curr.title)) {
            this.quality+=4;
        }
        else {
            this.quality=0;
        }

        if((curr.department&&/Computer Science|Technology/i.test(curr.department))) {
            this.quality+=2;
        }

      
    }
    function cmp_people(person1,person2) {
        if(!(person1 instanceof PersonQual && person2 instanceof PersonQual)) return 0;
        if(person2.quality!=person1.quality) return person2.quality-person1.quality;
        else if(person2.email && !person1.email) return 1;
        else if(person1.email && !person2.email) return -1;
        else return 0;

    }

     function paste_name_latta(e) {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");
        var ret=Gov.parse_data_func(text),fullname;
        console.log("ret="+JSON.stringify(ret));
        var x;
        if(ret&&ret.name) {
            fullname=MTP.parse_name(ret.name);
            ret.fname=fullname.fname;
            ret.lname=fullname.lname;
        }
        if(ret&&ret.fname) {
            var person_data=nlp(ret.name).people().out('tags');
            if(person_data.length>0) {
                my_query.selects.teacher_title=6;
                for(x of person_data[0].tags) {
                    if(/FemaleName/.test(x)) my_query.selects.teacher_title=2;
                    if(/MaleName/.test(x)) my_query.selects.teacher_title=1;
                }
            }
            console.log(person_data);
            my_query.fields.teacher_first_name=ret.fname;
            my_query.fields.teacher_last_name=ret.lname;
            my_query.fields.teacher_email=(ret.email)||"";
            if(ret.url) my_query.fields.teacher_url=ret.url;
            var subject_regexes=[/^[^A-Za-z]{20,}$/,/Computer Science/i,/Engineering/i,/English/i,/History/i,/Math/i,/Science/i,/.*/i];
            var subject_ind;


            for(subject_ind=0;subject_ind<subject_regexes.length;subject_ind++) {
                if(subject_regexes[subject_ind].test(ret.title)) break;
            }
            my_query.selects.teacher_subject=subject_ind;
            add_to_sheet();

        }

        else e.target.value=text;
    }

    function deal_with_zach_latta(result,s) {
        console.log("Dealing with zach latta");
        document.querySelector("[name='cs-teacher']").click();
        
        if(result.length>0&&result[0].quality>0) {

            insert_latta_data(result,s);

        }
        else {
            console.log("Nothing found, returning out of safety");
            GM_setValue("returnHit",true);
        }
    }


    function insert_latta_data(result,s) {
        var workButton=document.querySelector("#workContent .btn");
        var curr,fullname;
        var subject_regexes=[/^[^A-Za-z]{20,}$/,/Computer Science/i,/Engineering/i,/English/i,/History/i,/Math/i,/Science/i,/.*/i];
        var x,subject_ind;
        curr=result[0];

 
        my_query.fields.teacher_name=curr.name;
        my_query.fields.teacher_email=curr.email;//@/.test(curr.email)?curr.first[0].toLowerCase()+curr.last+"@"+MTP.get_domain_only(s.base,true):curr.email);
       submit_if_done();
    }


    function failed_search_func_latta(response) {
                var teacherSelect=document.querySelector("#found_teacher_with_email");
        var workButton=document.querySelector("#workContent .btn");
        console.log("Failed at search");
        if(response && response.closed) {
            console.log("School closed");
            teacherSelect.selectedIndex=3;
            workButton.click();
            setTimeout(final_latta_data,250);
        }
    }


    function init_Query() {
        console.log("in init_query");
        var i;
       // Gov.debug=true;

        var name=document.querySelector("crowd-form h2").innerText.trim().replace(/^[^:]*:\s*/,"");
        my_query={name:name,fields:{teacher_name:"",teacher_email:""},selects:{teacher_subject:"",teacher_title:""},done:{},submitted:false};
        
        var s;
        var url=document.querySelector("crowd-form a").href;
        document.querySelector("[name='teacher_name']").addEventListener("paste",paste_name_latta);




        var promise=new Promise((resolve,reject) => {
            s=new School({name:name,city:"",state:"",type:"school",url:url,
                              title_str:["Computer Science","Engineering","Programming","Comp Sci","Technol","Teacher"],
                              debug:true,failed_search_func:failed_search_func_latta,
                             title_regex:[/Computer Science|Engineering|Programming|Comp\.? Sci\.?|Technol|Teacher/i]},resolve,reject);

        });
        promise.then(function(self) {
            var i,curr,fullname;
            var result=[];
            for(i=0;i<s.contact_list.length;i++) result.push(new PersonQual(s.contact_list[i]));
            var type_lists={"Administration":{lst:[],num:'2'},"IT":{lst:[],num:'1'},"Communication":{lst:[],num:''}},curr_person,x;

            result.sort(cmp_people);
            console.log("result=",result);
            // For ZachLatta only
            deal_with_zach_latta(result,s);
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

       /* const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });*/
    }

})();
