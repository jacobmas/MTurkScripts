// ==UserScript==
// @name         Molo Webservices
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find marinas
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
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect *
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/7b1fc7b1a91f8960fbc52a7e5b63418a40e9869b/Govt/Government.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    var MTurk=new MTurkScript(20000,750+(Math.random()*1000),[],begin_script,"A34PBST2Q4WR64",false);
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
                console.log("parsed_context="+JSON.stringify(parsed_context));
            if(parsed_context.Address) {
                let add=new Address(parsed_context.Address);
                if(add && add.city) {
                    my_query.fields.addressLine1=add.address1;
                    my_query.fields.city=add.city;
                    my_query.fields.zip=add.postcode;
                    add_to_sheet();
                }
                console.log("add="+JSON.stringify(add));
            }
            if(parsed_context.Phone) {
                my_query.fields.phoneNumber=parsed_context.Phone;
                add_to_sheet();
            }

        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
                if(parsed_lgb.address) {
                    let add=new Address(parsed_lgb.address);
                    if(add && add.city) {
                        my_query.fields.addressLine1=add.address1;
                        my_query.fields.city=add.city;
                        my_query.fields.zip=add.postcode;
                        add_to_sheet();
                    }
                    console.log("add="+JSON.stringify(add));
                }
                if(parsed_lgb.phone) {
                    my_query.fields.phoneNumber=parsed_lgb.phone;
                    add_to_sheet();
            }

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
        var dept_regex_lst=[];

        var title_regex_lst=[/Admin|Administrator|Supervisor|Manager|Director|Founder|Owner|Officer|Secretary|Assistant/i];
        //var promise=MTP.create_promise(
        var query={dept_regex_lst:dept_regex_lst,
                       title_regex_lst:title_regex_lst,id_only:false,default_scrape:false,debug:false};
        var gov_promise=MTP.create_promise(my_query.url,Gov.init_Gov,gov_promise_then,function(result) {
            console.log("Failed at Gov "+result);
            if(my_query.fields.email.length===0) my_query.fields.email="NA";
            my_query.done.gov=true;
            submit_if_done(); },query);
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

    function paste_address(e) {
        e.preventDefault();
        // get text representation of clipboard
        var i;
        var text = ""+e.clipboardData.getData("text/plain");
        let add=new Address(text);
        if(add && add.city) {
            my_query.fields.addressLine1=add.address1;
            my_query.fields.city=add.city;
            my_query.fields.zip=add.postcode;
            add_to_sheet();
        }
    }

       function gov_promise_then(my_result) {
        var i,curr,fullname,x,num;
        my_query.done.gov=true;
        console.log("\n*** Gov.phone="+Gov.phone);
        var result=Gov.contact_list;
        var temp;
         var person_list=[];
    console.log("Gov result="+JSON.stringify(result));

         var type_lists={"Records":{lst:[],num:'3'},"Administration":{lst:[],num:'2'},"IT":{lst:[],num:'1'},"Communication":{lst:[],num:''}}
         for(i=0;i<result.length;i++) {
             temp=new PersonQual(result[i]);
             console.log("("+i+"), "+JSON.stringify(temp));
             if(temp.quality>0) {
                 person_list.push(temp); }
         }
         person_list.sort(cmp_people);
        my_query.person_list=person_list;
        console.log("Calling submit if done from gov_promise_then");
           console.log("Gov.email_list="+JSON.stringify(Gov.email_list));
           if(Gov.email_list.length>0) my_query.fields.email=Gov.email_list[0];
         submit_if_done();

//        console.log("result="+JSON.stringify(result));
    }

    function PersonQual(curr) {
        //this.curr=curr;
        var fullname;
        var terms=["name","title","phone","email"],x;
        var bad_last=/^(place|street)/i;
        this.last="";
        this.first="";
        for(x of terms) this[x]=curr[x]?curr[x]:"na";
        if(this.title) this.title=this.title.replace(/^[^A-Za-z]+/,"").replace(/[^A-Za-z]+$/,"");
        if(this.name) {
            this.name=this.name.replace(/^By /,"").replace(/^[^A-Za-z]+/,"");
            fullname=MTP.parse_name(curr.name);
            this.first=fullname.fname;
            this.last=fullname.lname;
        }
        if((!this.phone ||this.phone==="na") && Gov.phone) this.phone=Gov.phone;
        this.quality=0;
        if(curr.title) {
            if(/Director|Manager|President|CEO|Officer|Owner/.test(curr.title)) this.quality=3;
            else if(/Admin|Administrator|Supervisor|Manager|Director|Founder|Owner|Officer|Secretary|Assistant/.test(curr.title)) this.quality=1;
        }

      //  if(this.email && this.email.indexOf("@")!==-1) this.quality+=5;
        var nlp_out=nlp(this.name).people().out('terms');
        if(nlp_out&&nlp_out.length>0) {
            console.log("GLunch");
            //console.log(nlp_out);

            this.quality+=2;
        }
        else this.quality=0;
        if(this.email && MTP.get_domain_only(my_query.url,true)===this.email.replace(/^[^@]*@/,"")) this.quality+=1;
        if(!this.email || this.email==="na") this.quality=-1;
        if(/[\d\?:]+/.test(this.name)) this.quality=-1;
        if(this.name.split(" ").length>4) this.quality=-1;
        else if(MTP.is_bad_email(this.email)) this.quality=-1;
        else if(bad_last.test(this.last)) this.quality=-1;

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
        //var wT=document.getElementById("DataCollection").getElementsByTagName("table")[0];
        var dont=document.getElementsByClassName("dont-break-out");
        document.querySelector("#addressLine1").addEventListener("paste",paste_address);
        my_query={name:document.querySelector("#companyName").value,fields:{},done:{},submitted:false};
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name+" marina Texas";
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit"+MTurk.assignment_id,true); });
    }

})();