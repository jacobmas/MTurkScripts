// ==UserScript==
// @name         Zach Sheppard
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/School/School.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(70000,750+(Math.random()*1000),[],begin_script,"A1RAZ5XQD92P35",true);
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
            b_algo=search.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.Title) my_query.fields.schoolName=parsed_context.Title.replace(/✕.*$/,"").trim();
            if(parsed_context.Address) {
                let address=new Address(parsed_context.Address);
                my_query.fields.address1=address.address1;
                my_query.fields.address2=address.address2;
                my_query.fields.city=address.city;
                my_query.fields.state=address.state;
                my_query.fields.zip=address.postcode;
            }
            if(parsed_context.Title && parsed_context.Address) {
                resolve("");
                return;
            }
            else if(parsed_context.people&&parsed_context.people.length>0 && parsed_context.people[0].url&&my_query.try_count[type]<3) {
                my_query.try_count[type]+=1;
                GM_xmlhttpRequest({method: 'GET', url: parsed_context.people[0].url,
                           onload: function(response) { query_response(response, resolve, reject,type); },
                           onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }
                          });
                return;
            }

        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if((parsed_lgb.name||my_query.fields.schoolName) && parsed_lgb.address) {
                    my_query.fields.schoolName=parsed_lgb.name?parsed_lgb.name.trim():my_query.fields.schoolName;

                    let address=new Address(parsed_lgb.address);
                    my_query.fields.address1=address.address1;
                    my_query.fields.address2=address.address2;
                    my_query.fields.city=address.city;
                    my_query.fields.state=address.state;
                    my_query.fields.zip=address.postcode;
                    resolve("");
                    return;
                }
            }

        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        if(/query/.test(type) && my_query.try_count[type]===0) {
            my_query.try_count[type]++;

            query_search(my_query.url+" school", resolve, reject, query_response,"query");
            return;
        }
         if(/query/.test(type) && my_query.try_count[type]===1) {
            my_query.try_count[type]++;

            query_search(my_query.url, resolve, reject, query_response,"query");
            return;
        }
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
        my_query.done.query=true;
        submit_if_done();
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
        for(x in my_query.fields) {
            if(x==="address2"||x==="contact1email" || x==="contact2email") continue;
            if(!my_query.fields[x]) {
                console.log("missing field "+x); is_done=false;
            }
        }
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
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
            if(fullname.fname)
            this.first=fullname.fname.replace(all_caps_re,fix_allupper_name);
            if(fullname.lname) this.last=fullname.lname.replace(all_caps_re,fix_allupper_name);
        }
        this.quality=0;
        if(curr.title && /Principal|Dean|Head of School/i.test(curr.title)) {
            this.quality+=3;
        }
        if(curr.title && /^(Principal|Dean|Head of School)/i.test(curr.title)) {
            this.quality+=3;
        }
        if(curr.title && /^(Principal|Dean|Head of School)$/i.test(curr.title)) {
            this.quality+=3;
        }
        if(curr.title && /^(Director|President)$/i.test(curr.title)) {
            this.quality+=3;
        }



        if(this.email!=="na" && /@/.test(this.email)) this.quality+=6;
        if(/[\d\?]+/.test(this.name)) this.quality=-1;
        var nlp_out=nlp(this.name).people().json();
        if(nlp_out.length>0) this.quality+=5;
        if(/About|School|Career|(^|\s)&|and|of\s/i.test(this.name) || /He is|Cook/.test(this.title)) this.quality=0;
    }


    function cmp_people(person1,person2) {
        if(!(person1 instanceof PersonQual && person2 instanceof PersonQual)) return 0;
        if(person2.quality!=person1.quality) return person2.quality-person1.quality;
        else if(person2.email && !person1.email) return 1;
        else if(person1.email && !person2.email) return -1;
        else return 0;

    }


    School.prototype.parse_apptegy=function(doc,url,resolve,reject,self) {
        self.staff_dir=url;
        console.log("in School.prototype.parse_apptegy at url="+url);
        doc.querySelectorAll(".contact-info,.staff-info").forEach(function(elem) { self.parse_apptegy_field(elem,self,url); });
        resolve(self);
    };
    /* Helper to parse an individual person for Schools.parse_apptegy */
    School.prototype.parse_apptegy_field=function(elem,self,url) {
        //  console.log("parse_apptegy_field,elem="+elem.innerText);
        var f_n={"name":"name","title":"title","phone-number":"phone","department":"department","email":"email"};
        var curr_c={url:url},x,curr_f;
        for(x in f_n) if((curr_f=elem.getElementsByClassName(x)).length>0) curr_c[f_n[x]]=curr_f[0].innerText.trim();
        var ext;
        if(curr_c.name && (ext=curr_c.name.match(/\s*Ext.*/i))) {
            if(curr_c.phone) curr_c.phone=curr_c.phone+" "+ext[0];
            curr_c.name=curr_c.name.replace(/\s*Ext.*/i,"");
        }
        if(curr_c.title && self.matches_title_regex(curr_c.title)) self.contact_list.push(curr_c);
        // else console.log("curr_c.title="+curr_c.title);
    };

    if(/mturkcontent\.com/.test(window.location.href)) {
        setTimeout(init_Query,1000);
    }
    else {
        GM_addValueChangeListener("returnHit",function() {
            if(GM_getValue("automate")) {
                document.querySelector("button[type='submit']").click();
            }
        });
        setTimeout(function() {                 document.querySelector("button[type='submit']").click() }, 60000);

    }

    function init_Query()
    {
        var div=document.querySelectorAll("crowd-form div");
        console.log("div=",div);
        var name;
        var lastfieldname="";
        var x;
        var schoolname;
        var target_title="";
        var found_contact_count=0;
        var schooladdress="";
        for(x of div) {
            console.log("lastfieldname=",lastfieldname);
            if(/Organization name/.test(lastfieldname)) {
                schoolname=x.innerText.trim();
                lastfieldname="";
            }
            if(/Organization address/.test(lastfieldname) && !x.querySelector("strong")) {
                schooladdress=schooladdress+(schooladdress.length>0?", ":"")+x.innerText.trim();
            }
            if(/Target /.test(lastfieldname)&&found_contact_count===0) {
                name=x.innerText.trim();
                found_contact_count++;
            }
             else if(/Target /.test(lastfieldname)&&found_contact_count>0) {
                target_title=x.innerText.trim();
                found_contact_count++;
                 lastfieldname="";

            }


           let strong=x.querySelector("strong");
            if(strong) lastfieldname=strong.innerText.trim();

        }

        var s;
        console.log("name=",name," schoolname=",schoolname, "schooladdress=",schooladdress,"target_title=",target_title);
        let shadow=document.querySelector("crowd-form").shadowRoot;
        console.log("shadow=",shadow);

        let mybutton=shadow.querySelector("button[type='submit']");
        console.log("mybutton=",mybutton);

        var parsed_name=MTP.parse_name(name);
        var address=new Address(schooladdress);
       var promise=new Promise((resolve,reject) => {
            s=new School({type:"school",name:schoolname,city:address.city,state:address.state,
                              title_str:["Principal"],
                              debug:true,
                             title_regex:[/Principal/i]},resolve,reject);

        });
        promise.then(function(self) {
            var i,curr,fullname;
            var found_principal=false;
            var pos=1;
            var result=[];
            console.log("s.contact_list=",s.contact_list);
            for(i=0;i<s.contact_list.length;i++) result.push(new PersonQual(s.contact_list[i]));
            var type_lists={"Administration":{lst:[],num:'2'},"IT":{lst:[],num:'1'},"Communication":{lst:[],num:''}},curr_person,x;
            result.sort(cmp_people);
            console.log("result=",result);
            var j;
            var success=false;
            var other_good=null;
            for(j=0; j<result.length;j++) {
                curr=result[j];
                if(curr.quality===0) continue;
                if(curr.email==="na") curr.email="";
                let curr_parsed_name=MTP.parse_name(curr.name);

                if(curr.email && /@/.test(curr.email) && curr_parsed_name.fname===parsed_name.fname && curr_parsed_name.lname===parsed_name.lname) {
                    console.log("Found good at ",curr);

                    document.querySelector("[name='email']").value=curr.email;
                    success=true;

                    if(GM_getValue("automate")) {
                        setTimeout(function() { mybutton.click() }, 600);
                    }
                    return;

                }
                else if(!other_good && curr.email && /@/.test(curr.email) && curr.title===target_title) {
                    other_good=curr;
                }

            }
            if(other_good&&!success) {
                document.querySelector("crowd-checkbox").click();
                document.querySelector("[name='alt_name']").value=other_good.name;
                document.querySelector("[name='alt_email']").value=other_good.email;
                success=true;
                console.log("Found other good=",other_good);
             if(GM_getValue("automate")) {
                        setTimeout(function() { mybutton.click() }, 600);
                    }
                    return;


            }
            GM_setValue('returnHit',true);


            
        }).catch(function(error) {
            console.log("Error: "+error);

            GM_setValue('returnHit',true);
        });
    }



})();