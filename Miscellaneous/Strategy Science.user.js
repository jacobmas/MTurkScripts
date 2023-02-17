// ==UserScript==
// @name        Strategy Science
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find first name and last name and email by journal article
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
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/41f28341fd1a349b9ae459187298a8164a38f890/js/MTurkScript.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Govt/Government.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/Address.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/AggParser.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/Email/MailTester.js
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(60000,750+(Math.random()*1000),[],begin_script,"A3QTLN2IJZ3068",true);
    var MTP=MTurkScript.prototype;

    /* Returns a score of how well a name matches email, 0 meaning not at all */
MTurkScript.prototype.score_name_to_email=function(name, email, institution_domains) {
	const email_domain=email.replace(/^[^@]*@/).trim();
	const email_begin=email.replace(/@.*$/,"").toLowerCase().trim();
	const parsed_name = MTurkScript.prototype.parse_name(name.trim());
	const fname = parsed_name.fname.replace(/^[^A-Za-z]*/,"").trim().toLowerCase();
	const mname=parsed_name.mname.toLowerCase();

	const lname=parsed_name.lname.replace(/^[^A-Za-z]*/,"").trim().toLowerCase();

	// Check institution domain
	if(institution_domains && !matches_institution(email_domain, institution_domains)) return -1;
	if(/^(support|info|media|marketing|webmaster)$/.test(email_begin)) return -1;

	const always_good_prefixes = [fname+"\."+lname,fname.substring(0,1)+lname,fname.substring(0,1)+"\."+lname,fname.substring(0,1)+"_"+lname,fname+lname.substring(0,1),
                                  lname+fname.substring(0,1),
								 fname+"_"+lname,lname+"\."+fname,lname+"_"+fname,lname+"_"+fname.substring(0,1),fname+"\."+mname.substring(0,1)+"\."+lname];
	let prefix;
	for(prefix of always_good_prefixes) {
		if(new RegExp("^"+prefix).test(email_begin)||email_begin.indexOf(prefix)!=-1||prefix.indexOf(email_begin)!=-1 ) {
			return 10;
		}
	}
	let single;
	const single_name_matches=[fname,lname];
	for(single of single_name_matches) {
		if(email_begin===single) {
			return 5;
		}
	}
	let mixed=[fname.substr(0,1)+"[^a-z]*"+lname+"[^a-z]*"];
	for(single of mixed) {
		if(new RegExp("^"+mixed).test(email_begin)) {
			return 4;
		}
	}

	return 0;


};

    function is_bad_name(b_name)
    {
        return false;
    }

    function query_response(response,resolve,reject,type) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl+", type="+type);
        var search, b_algo, i=0, inner_a;
        var b_url="crunchbase.com", b_name, b_factrow,lgb_info, b_caption,p_caption, parsed_b_ans;
        var b1_success=false, b_header_search,b_context,parsed_context,parsed_lgb, b_ans;
        try
        {
            search=doc.getElementById("b_content");
			b_algo=doc.querySelectorAll("#b_results > .b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            b_ans=doc.querySelector(".b_ans.b_top");

            console.log("b_algo.length="+b_algo.length);
	    if(b_context&&(parsed_context=MTP.parse_b_context(b_context))) {
                console.log("parsed_context="+JSON.stringify(parsed_context)); 
				
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
            
					
					}
            for(i=0; i < b_algo.length&&i<5; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].querySelector("h2 a").href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                let temp;
                if(type==="researchgate"&&b_name.toLowerCase().indexOf(my_query.title.replace(/\s.*$/,"").toLowerCase())!==-1&&!/\.pdf/.test(b_url)) {

                    resolve(b_url);
                    return;
                }

                if(i==0 && type==="scholar" && /scholar\.google\.com/.test(b_url) && b_name.toLowerCase().indexOf(my_query.last_name.toLowerCase())!==-1) {// my_query.try_count[type]===0 && /scholar\.google.com\/.*user/.test(b_url)) {

                    my_query.name=b_name.replace(/\s*-\s*.*$/,"");
                    resolve(b_url);
                    return;

                }
                if(type==="query" && /en\.wikipedia\.org/.test(b_url) && new RegExp(my_query.last_name+"\\s*was").test(p_caption)) {
                    my_query.fields.email="dead@dead.com";
                    resolve({done:true});
                    return;
                }

                if(type==="query" && !MTurkScript.prototype.is_bad_url(b_url, bad_urls,-1) && /\.edu\/||(\.[a-z]{2}\/)/.test(b_url)
		   && (b1_success=true)) break;
            }
            if(b1_success && (resolve({url:b_url,name:b_name,caption:p_caption})||true)) return;
        }
        catch(error) {
            reject(error);
            return;
        }
	do_next_query(resolve,reject,type);
        return;
    }
    function do_next_query(resolve,reject,type) {
        if(my_query.try_count[type]===0) {
            my_query.try_count[type]++;
             query_search(my_query.name, resolve, reject, query_response,"query");

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



    function query_promise_then(result) {
        console.log("result=",result);
        if(result.done) {
            submit_if_done();
            return;
        }
        my_query.url=result.url;

        var split_name = result.name.split(/\s*[\|\-–—]\s*/);
        console.log("split_name=",split_name);

        var item;
      for(item of split_name) {
            if(item.indexOf(my_query.last_name)!=-1&&!my_query.fields.authorFirstName) {
                let parsed_name=MTP.parse_name(item);
                my_query.fields.authorFirstName=parsed_name.fname;
                my_query.fields.authorLastName=parsed_name.lname;
                break;
            }
        }

        var query={dept_regex_lst:[/Staff/],title_regex_lst:[/Owner/,/Manager/,/Director/]};
        var promise=MTP.create_promise(my_query.url,parse_emails,gov_promise_then,function() { GM_setValue("returnHit",true); });

        //var promise=MTP.create_promise(my_query.url,Gov.init_Gov,gov_promise_then,function() { GM_setValue("returnHit",true); },query);

    }
    function parse_emails(doc,url,resolve,reject) {
        var inner_a=doc.querySelectorAll("a");

        Gov.scrape_lone_emails(doc,url);
        resolve("");
    }

    function scholar_promise_then(url) {

        var promise=MTP.create_promise(url,parse_scholar,parse_scholar_then,function() { GM_setValue("returnHit",true); });


    }

    function parse_scholar(doc,url,resolve,reject) {
        console.log("MOOO");
        var person_item=doc.querySelectorAll(".nova-legacy-v-person-list-item__align-content");
        var person, name, title;
        for(person of person_item) {
            name=person.querySelector(".nova-legacy-v-person-list-item__title");
            title=person.querySelector(".nova-legacy-v-person-list-item__align-content .nova-legacy-v-person-list-item__meta");
            if(!name) continue;
            //console.log("name=",name.innerText);
            //console.log("title=",title);

            if(name.innerText.toLowerCase().trim().indexOf(my_query.last_name.toLowerCase().trim())!==-1) {
                my_query.name=name.innerText.trim();
                 let parsed_name=MTP.parse_name(my_query.name);
                my_query.fields.authorFirstName=parsed_name.fname;
                my_query.fields.authorLastName=parsed_name.lname;
                if(title) {
                    my_query.institution=title.innerText.trim();

                }
                else my_query.institution="";
                break;
            }



        }
        resolve("");
            return;
        //


    }

    function parse_scholar_then() {
        var search_str=my_query.name+" "+my_query.institution;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning query search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
    }

    function gov_promise_then() {
        var i;
        var domain=MTP.get_domain_only(my_query.url,true);
        for(i=0;i<Gov.email_list.length;i++) {

            Gov.email_list[i].score = MTP.score_name_to_email(my_query.name,Gov.email_list[i].email);
        }
        console.log("bob,",my_query.name);
        Gov.email_list.sort(function(a,b) { return b.score-a.score; });

        console.log("Gov.email_list=",Gov.email_list);

        if(Gov.email_list.length>0&&Gov.email_list[0].score>0||
           (!/info/.test(Gov.email_list[0].email))) {
            my_query.fields.email=Gov.email_list[0].email;
        }
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
        for(x in my_query.fields) if(!my_query.fields[x]) is_done=false;
        if(is_done && !my_query.submitted && (my_query.submitted=true)) MTurk.check_and_submit();
        else if(is_done_dones && !my_query.submitted) {
            console.log("Failed to find all fields");
            GM_setValue("returnHit",true);
        }
    }

    function init_Query()
    {
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
        var p=document.querySelector("crowd-form p").innerText.trim();
        var author_re=/([^\(]*).*?\)\s([^\.]*)\.?([^\(\d]*)([^\.]*)\.[^\.]*$/;

        var author_match=p.match(author_re);
        if(!author_match) author_match=p.match(/([^\(]*).*?\)\s([^\.]*)/);
        console.log("author_match=",author_match);

        my_query={name:author_match[1],title:author_match[2],institution:"",journal:author_match.length>=4?author_match[3]:"",fields:{email:"",authorFirstName:"",authorLastName:""},done:{},
		  try_count:{"query":0},
		  submitted:false};
        my_query.name=my_query.name.replace("’","\'");
        my_query.last_name=my_query.name.replace(/\s.*$/,"");
        my_query.fields.authorLastName=my_query.last_name;
	console.log("my_query="+JSON.stringify(my_query));
        var search_str=my_query.last_name+" "+my_query.title+" site:researchgate.net/publication";
        const scholarPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response,"researchgate");
        });
        scholarPromise.then(scholar_promise_then)
            .catch(function(val) {
            console.log("Failed at this scholarPromise " + val);var search_str=my_query.name+" "+my_query.institution;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning query search");
            query_search(search_str, resolve, reject, query_response,"query");
        });
        queryPromise.then(query_promise_then)
            .catch(function(val) {
            console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); }); });
    }

})();