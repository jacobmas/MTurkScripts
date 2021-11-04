// ==UserScript==
// @name         Tuan Ho
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Restaurants
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include https://www.facebook.com/*
// @include https://m.facebook.com/*
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=["tripadvisor.com",".hub.biz"];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(75000,750+(Math.random()*1000),[],begin_script,"A2LWAUZF9DLJE7",true);
    if(/facebook\.com/.test(window.location.href)) {
        console.log("On Facebook");
        GM_addValueChangeListener("facebook", function(name, old_value, new_value, remote) {
            window.location.href=new_value;
        })
        setTimeout(function() { test_for_mail(0) }, 500);



    }

    function test_for_mail(iteration) {
        if(iteration>9) {
            GM_setValue("email",""); GM_setValue("failfb",true); return; }
        console.log("iteration=",iteration);
        //console.log("document.querySelector('a')=",document.querySelectorAll('a'));
        let mail=document.querySelector("a[href^='mailto']");
        if(mail) {
            console.log("mail=",mail);
            GM_setValue("email",mail.innerText.trim());
            return;
        }
        else {
            let mail_img=document.querySelector("img[src='https://static.xx.fbcdn.net/rsrc.php/v3/yf/r/4mSNCiGuFsr.png']");
            if(mail_img) {
                let span=mail_img.parentNode.parentNode.querySelector("span");
                if(span) {
                    GM_setValue("email",span.innerText.trim());
                    return;
                }
            }
        }
        iteration+=1;
        setTimeout(function() { test_for_mail(iteration) }, 500);

    }

    var MTP=MTurkScript.prototype;
    function is_bad_name(b_name)
    {
        return false;
    }



    const convertTime12to24 = (time12h) => {
        const [time, modifier] = time12h.split(' ');

        let [hours, minutes] = time.split(':');

        if (hours === '12') {
            hours = '00';
        }

        if (modifier === 'PM') {
            hours = parseInt(hours, 10) + 12;
        }

        return `${hours}:${minutes}`;
    }

    function parse_hours_table(table) {
        var row,col;
        var hours_dict={};
        for(row of table.tBodies[0].rows) {
            console.log("row=",row);
            if(row.cells.length>=2) {
                var split_times=row.cells[1].innerText.trim().split(/ - /);
                console.log("split_times=",split_times);
                if(split_times.length>=2) {
                    split_times[0]=split_times[0].replace("Noon","12:00 PM").replace(/midnight/i,"12:00 AM").replace(/^(\d+) /,"$1:00 ").replace(/^(\d:)/,"0$1");
                    split_times[1]=split_times[1].replace("Noon","12:00 PM").replace(/Midnight/i,"12:00 AM").replace(/^(\d+) /,"$1:00 ").replace(/^(\d:)/,"0$1");

                    var open24=convertTime12to24(split_times[0]), close24=convertTime12to24(split_times[1]);

                    var curr_dict={"open":split_times[0],"close":split_times[1],"open24":open24,"close24":close24,"closed":false};

                    hours_dict[row.cells[0].innerText.trim()]=curr_dict;
                }
                else if(/Closed/i.test(row.cells[1].innerText)) {
                    hours_dict[row.cells[0].innerText.trim()]={"closed":true};
                }
                else {
                    console.error("Error parsing hours dict, found ", row.cells[1].innerText, " as time");
                }


            }
        }
        return hours_dict;
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
            var table=b_context.querySelector(".opHours table");
                if(table) {
                    let hours_dict=parse_hours_table(table);
                    console.log("hours_dict=",hours_dict);
                    if(hours_dict['Wednesday']!==undefined) {
                        console.log("hours_dict['Wednesday']=",hours_dict.Wednesday);

                        my_query.fields['opensAt']=hours_dict['Wednesday']['open24'];
                        my_query.fields.closesAt=hours_dict['Wednesday']['close24'];
                    }
                }
            if(parsed_context.Phone) my_query.fields.phone=parsed_context.Phone;
            if(parsed_context.Address) {
                let add=new Address(parsed_context.Address.split(/·/)[0].trim());
                console.log("add=",add);
                var list=["address1","address2","city","state"];
                var x;
                for(x of list) if(add[x]&&add[x]!=="") my_query.fields[x]=add[x];
                my_query.fields.zip=add.postcode;

            }
               if(parsed_context.Facebook)
            {
                GM_addValueChangeListener("email",function(name, old_value, new_value, remote) {
                    if(new_value&&/@/.test(new_value)) {
                        my_query.fields.email=new_value;
                    }
                    my_query.done.facebook=true;
                    submit_if_done();
                })
                GM_setValue("facebook",parsed_context.Facebook);
            }
            else {
                my_query.done.facebook=true;
                submit_if_done();
            }
            if(parsed_context.url && !MTP.is_bad_url(parsed_context.url, bad_urls)) {
                resolve(parsed_context.url);
                return;
            }
         
        }
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                let table=lgb_info.querySelector(".opHours table");
                if(table) {
                    let hours_dict=parse_hours_table(table);
                    console.log("hours_dict=",hours_dict);
                    if(hours_dict['Wednesday']!==undefined) {
                        console.log("hours_dict['Wednesday']=",hours_dict.Wednesday);

                        my_query.fields['opensAt']=hours_dict['Wednesday']['open24'];
                        my_query.fields.closesAt=hours_dict['Wednesday']['close24'];
                    }
                }


                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb));
             if(parsed_lgb.phone) my_query.fields.phone=parsed_lgb.phone;
                if(parsed_lgb.address) {
                    let add=new Address(parsed_lgb.address.split(/·/)[0].trim());
                    console.log("add=",add);
                    let list=["address1","address2","city","state"];
                    let x;
                    for(x of list) if(add[x]) my_query.fields[x]=add[x];
                    my_query.fields.zip=add.postcode;
                }
                if(parsed_lgb.url && !MTP.is_bad_url(parsed_lgb.url, bad_urls)) {
                    resolve(parsed_lgb.url);
                    return;
                }
            }
            for(i=0; i < b_algo.length; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
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
        my_query.url=result;
        my_query.fields.website=result;
        add_to_sheet();
        var promise=MTP.create_promise(my_query.url,Gov.init_Gov,parse_emails_then,function() { GM_setValue("returnHit", true); },
                                       {dept_regex_lst:[/Staff/],title_regex_lst:[/Owner/,/Manager/]});
    }

    function parse_emails_then() {
        my_query.done.query=true;
        console.log("Gov.email_list=",Gov.email_list);
        if(Gov.email_list.length>0) my_query.fields.email=Gov.email_list[0].email;
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
        var is_done=true,x,is_done_dones=true;
        add_to_sheet();
        for(x in my_query.done) if(!my_query.done[x]) is_done=false;
        is_done_dones=is_done;
        console.log("is_done=",is_done);
        for(x in my_query.fields) {
            if(!my_query.fields[x]) {
                console.log("Failed to find ", x);
                is_done=false;
            }
        }
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
            return;
        }
    }

    function init_Query()
    {

        bad_urls=default_bad_urls.concat(bad_urls);
        console.log("in init_query");
        var i;
        var name=document.querySelector("crowd-form a").innerText.trim();
        var match_re=/^(.*) in (.*)$/;
        var match=name.match(match_re);
        my_query={name:match[0],location:match[1], fields:{address1:"",phone:"",email:"",website:"",opensAt:""},done:{"query":false,"facebook":false},
		  try_count:{"query":0},
		  submitted:false};
          GM_setValue("failfb",false);
        GM_addValueChangeListener("failfb",function() {
            my_query.done.facebook=true;
            submit_if_done();
        });
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.name;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

})();