// ==UserScript==
// @name         Ben Staveley
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Find instagram, followers given website
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
// @require https://raw.githubusercontent.com/spencermountain/compromise/master/builds/compromise.min.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==

(function() {
    'use strict';
    var my_query = {};
    var bad_urls=[];
    /* TODO should be requester #, last field should be if it's crowd or not */
    var MTurk=new MTurkScript(30000,1000+(Math.random()*2000),[],begin_script,"A1Y0NDLYARQRZF",true);
    var MTP=MTurkScript.prototype;
    MTurkScript.prototype.longest_common_substring=function(string1, string2, caps) {
        // Convert strings to arrays to treat unicode symbols length correctly.
        // For example:
        // '𐌵'.length === 2
        // [...'𐌵'].length === 1
        const s1 = [...string1];
        const s2 = [...string2];

        // Init the matrix of all substring lengths to use Dynamic Programming approach.
        const substringMatrix = Array(s2.length + 1).fill(null).map(() => {
            return Array(s1.length + 1).fill(null);
        });

        // Fill the first row and first column with zeros to provide initial values.
        for (let columnIndex = 0; columnIndex <= s1.length; columnIndex += 1) {
            substringMatrix[0][columnIndex] = 0;
        }

        for (let rowIndex = 0; rowIndex <= s2.length; rowIndex += 1) {
            substringMatrix[rowIndex][0] = 0;
        }

        // Build the matrix of all substring lengths to use Dynamic Programming approach.
        let longestSubstringLength = 0;
        let longestSubstringColumn = 0;
        let longestSubstringRow = 0;

        for (let rowIndex = 1; rowIndex <= s2.length; rowIndex += 1) {
            for (let columnIndex = 1; columnIndex <= s1.length; columnIndex += 1) {
                if (s1[columnIndex - 1] === s2[rowIndex - 1] &&

                   (!caps || substringMatrix[rowIndex - 1][columnIndex - 1]>0 || /^[A-Z]/.test(s1[columnIndex-1]))) {

                    substringMatrix[rowIndex][columnIndex] = substringMatrix[rowIndex - 1][columnIndex - 1] + 1;
                } else {
                    substringMatrix[rowIndex][columnIndex] = 0;
                }

                // Try to find the biggest length of all common substring lengths
                // and to memorize its last character position (indices)
                if (substringMatrix[rowIndex][columnIndex] > longestSubstringLength) {
                    longestSubstringLength = substringMatrix[rowIndex][columnIndex];
                    longestSubstringColumn = columnIndex;
                    longestSubstringRow = rowIndex;
                }
            }
        }

        if (longestSubstringLength === 0) {
            // Longest common substring has not been found.
            return '';
        }

        // Detect the longest substring from the matrix.
        let longestSubstring = '';

        while (substringMatrix[longestSubstringRow][longestSubstringColumn] > 0) {
            longestSubstring = s1[longestSubstringColumn - 1] + longestSubstring;
            longestSubstringRow -= 1;
            longestSubstringColumn -= 1;
        }

        return longestSubstring;
    };

    MTurkScript.prototype.company_from_copyright=function(doc,url,debug) {
        var div_list=doc.querySelectorAll("div,p");
        var copyright_list=[];
        var title=doc.title||"";
        div_list.forEach(function(elem) {
            if(elem.querySelector("div,p")) return;
            MTurkScript.prototype.find_copyright_elem(elem,copyright_list,title,debug); });
        return copyright_list;
    };
    /* Helper for company_from_copyright */
    MTurkScript.prototype.find_copyright_elem=function(elem,lst,title,debug) {
        var re=/^\s*(?:Copyright)?\s*(?:©)\s*(?:Copyright)?\s*(?:[\d\-\.,]{4,})?(?:[\s\|\.·]*)([^\n\t\|\-\.·,]*)/,match;
        var re2=/^\s*©(?:\s*Copyright)? \s*(?:[\d\-\.,]*)\s*([^\n\t\|\-\.·,]*)/;
        var re3=/^\s*(?:Copyright)\s*(?:(?:19|20)[\d\-\.\,]*)\s*([^\n\t\|\-\.·,]*)/;
        var my_match;
        if((match=elem.innerText.match(re))||(match=elem.innerText.match(re2))||(match=elem.innerText.match(re3))) {
            if(debug) console.log("match=",match);
            my_match=match[1].trim().replace(/((19[\d]{2})|(20[\d]{2}))$/,"").trim();
            my_match=my_match.replace(/((?:19|20)[\d]{2})?\s*All Rights Reserved$/i,"").replace(/®/g,"")
                .replace(/\s*via.*$/,"").replace(/Powered by.*$/i,"").replace(/\s+•/,"")
                .replace(/ (Corporation|Inc\.?).*$/," $1")
                .trim();
            if(debug) console.log("my_match=",my_match);

            if(my_match.length>0&&!/Document|Copyright/i.test(my_match)) {
                lst.push(my_match);
            }
            else if(title) {
                let longest=MTurkScript.prototype.longest_common_substring(elem.innerText,title,true);
                if(longest.length>=5) { lst.push(longest); }
                var lower_match=longest.match(/\s[^A-Z]/g);
                if(debug) console.log("longest=",longest,"lower_match=",lower_match);

            }
        }
    };

    /* Find the company name from the website, returns sorted list of objects with
name, priority (lower is better) */
    MTurkScript.prototype.find_company_name_on_website=function(doc,url,debug) {
        var possible_name_list=[];
        var desc=doc.querySelector("meta[name='description']");
        if(!desc) desc=doc.querySelector("meta[name='Description']");
        if(desc) {
            let desc_re=/^((?:[A-Z][a-z\-]+\s)+)\s*is\s+(a|an|your)\s/;
            let desc_match=desc.content.match(desc_re);
            if(debug) console.log("desc_match=",desc_match);
            if(desc_match) {
                 possible_name_list.push({name:desc_match[1].trim(),priority:10});
            }
            if(debug) console.log("desc.content=",desc.content);
        }

        var title=doc.title;
        if(title&&debug) console.log("title=",title);
        if(desc && title) {
            
            let longest=MTurkScript.prototype.longest_common_substring(desc.content,title,true);
            if(debug) console.log("longest=",longest);
            var lower_match=longest.match(/\s[^A-Z]/g);
          //  console.log("lower_match=",lower_match);
        }
        //console.log("match=",match);
        //console.log(doc.body.innerText.match(/Professor.*/,""));
        var site_name=doc.querySelector("meta[property='og:site_name']");
        if(site_name&&!/^Default$/i.test(site_name)) { console.log("Found site name=",site_name.content);
                                                      possible_name_list.push({name:site_name.content.replace(/Website of\s*/i,"")
                                                                               .replace(/\s\|\s.*$/,""),priority:0});
                                                     }
        var logo=doc.querySelectorAll("img[id*='logo' i],img[src*='logo.' i],img[data-src*='logo.' i");
        var x,penalty_re=/Document|Blog/i,temp_cost=0;
        var logo_counter=0;
        for(x of logo) {
            //	console.log("x=",x);
            if(x.alt) x.alt=x.alt.replace(/\slogo$/i,"").replace(/Website of\s*/i,"");
            if(x.alt && /^[A-Z]/.test(x.alt) && !/Logo|(^\s*Home\s*)/i.test(x.alt)) {
                if(debug) console.log("Found logo alt try 1=",x.alt);
                temp_cost=penalty_re.test(x.alt)?10:0;
                if(x.alt.length>25) temp_cost+=10;

                possible_name_list.push({name:x.alt,priority:3+3*logo_counter+temp_cost});
   logo_counter++;
            }
        }
        if(logo.length===0) {
            logo=doc.querySelectorAll("img[id*='logo' i],img[src*='logo' i],img[data-src*='logo' i");
            for(x of logo) {
                //console.log("x=",x);
                if(x.alt) x.alt=x.alt.replace(/\slogo(\s|$)/i,"$1").replace(/Website of\s*/i,"");;
                if(x.alt && /^[A-Z]/.test(x.alt) && !/^\s*Logo\s*$|(^\s*Home\s*)/i.test(x.alt)) {
                   if(debug)  console.log("Found logo alt try 2=",x.alt);
                    temp_cost=penalty_re.test(x.alt)?10:0;
                    if(x.alt.length>25) temp_cost+=10;

                    possible_name_list.push({name:x.alt,priority:6+3*logo_counter+temp_cost});
                                        logo_counter++;


                }
            }
        }

        var copyright_list=MTP.company_from_copyright(doc,url,debug);
        console.log("copyright_list=",copyright_list);
        for(x of copyright_list) {
            if(copyright_list.length>0&&!/Copyright|document/i.test(copyright_list[0])) {
                possible_name_list.push({name:x.replace(/\s{2,}.*$/,""),priority:10});
                // return copyright_list[0].replace(/\s{2,}.*$/,"");

            }
        }
        for(x of possible_name_list) {
            x.name=x.name.replace("&#39;","\'").replace(/™/,"");
        }
        possible_name_list.sort(function(el1, el2) { return el1.priority-el2.priority; });
        console.log("possible_name_list=",possible_name_list);
        //if(possible_name_list.length>0) return possible_name_list[0].name;

        return possible_name_list;

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
            //    resolve(parsed_context.url);
              //  return;
            }
				} 
            if(lgb_info&&(parsed_lgb=MTP.parse_lgb_info(lgb_info))) {
                    console.log("parsed_lgb="+JSON.stringify(parsed_lgb)); 
					if(parsed_lgb.url&&!MTP.is_bad_url(parsed_lgb.url,bad_urls,-1)) {
               // resolve(parsed_lgb.url);
                //return;
            }
					
					}
            for(i=0; i < b_algo.length&&i<1; i++) {
                b_name=b_algo[i].querySelector("h2 a").textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
                b_caption=b_algo[i].getElementsByClassName("b_caption");
                p_caption=(b_caption.length>0 && b_caption[0].getElementsByTagName("p").length>0) ?
                    p_caption=b_caption[0].getElementsByTagName("p")[0].innerText : (b_algo[i].querySelector("p")? b_algo[i].querySelector("p").innerText.trim():"");
                console.log("("+i+"), b_name="+b_name+", b_url="+b_url+", p_caption="+p_caption);
                if(!MTP.is_bad_instagram(b_url) && !MTurkScript.prototype.is_bad_name(b_name,my_query.name,p_caption,i)
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
        if(my_query.try_count[type]===0) {
            my_query.try_count[type]++;
            my_query.name=my_query.domain.replace(/\..*$/,"");
            query_search(my_query.domain+" site:instagram.com", resolve, reject, query_response,"query");
            return;
        }
        reject("");
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
    /**
 * parse_insta_script is a helper for parse_instagram that extracts the useful data
 */
AggParser.parse_insta_script=function(parsed)
    {
        var x,y,z;
    console.log("parsed=",parsed);
    if(parsed.entry_data.HttpErrorPage) {
        return {"not_found":true,success:false};
    }
        var user=parsed.entry_data.ProfilePage[0].graphql.user;
        var result={success:true,followers:"",following:"",name:"",
                    username:"",url:"",is_business:false,email:"",phone:"",
                   category:"",address:{},biography:""};
        if(user.edge_followed_by!==undefined &&
           user.edge_followed_by.count!==undefined) result.followers=user.edge_followed_by.count;
         if(user.edge_follow!==undefined &&
           user.edge_follow.count!==undefined) result.following=user.edge_follow.count;
        if(user.full_name!==undefined) result.name=user.full_name;
        if(user.username!==undefined) result.username=user.username;
        if(user.external_url!==undefined) result.url=user.external_url;
        if(user.is_business_account!==undefined) result.is_business=user.is_business_account;
        if(user.business_email) result.email=user.business_email;
	if(user.profile_pic_url) result.profile_pic_url=user.profile_pic_url;
        if(user.business_address_json)
        {
            let temp_add=JSON.parse(user.business_address_json);
            result.address={addressLine1:temp_add.street_address, city:temp_add.city_name.replace(/,.*$/,""),
                            state:temp_add.region_name, country:"",country_code:temp_add.country_code};
            if(result.address.state.length===0) result.address.state=temp_add.city_name.replace(/^[^,]*,\s*/,"");
        }
        if(user.biography) result.biography=user.biography;
        if(user.business_phone_number) result.phone=user.business_phone_number;
        return result;
    }

/** parser for instagram to read the data */
AggParser.parse_instagram=function(doc,url,resolve,reject) {
    var scripts=doc.scripts,i,j,parsed,script_regex=/^window\._sharedData\s*\=\s*/;
    var result={success:false};
    for(i=0; i < scripts.length; i++) {

        if(script_regex.test(scripts[i].innerHTML))  {
            parsed=JSON.parse(scripts[i].innerHTML.replace(script_regex,"").replace(/;$/,""));
            try {
                result=AggParser.parse_insta_script(parsed);
            }
            catch(error) { console.log("Error in parse_insta_script"+error); }
            result.not_found=false;
            resolve(result);
            break;
        }
    }
    console.log("Blop");
    let err=doc.querySelector(".error-container");
    if(err) console.log("err=",err.innerText);
    if(err && /Please wait/i.test(err.innerText)) result.not_found=false;
    else result.not_found=true;
    resolve(result);
    return;
};

    function find_insta(doc,url,resolve,reject) {
        var a;
        let names=MTurkScript.prototype.find_company_name_on_website(doc,url,true);
        console.log("names="+JSON.stringify(names));
        if(names.length>0) my_query.name=names[0].name;
        for(a of doc.links) {
            //console.log("a.href=",a.href);
            if(/instagram\.com/.test(a.href) && !MTP.is_bad_instagram(a.href)&&a.href!=="https://www.instagram.com/"&&!/https?:\/\/instagram\.com\/?$/.test(a.href)) {
                my_query.found_on_page=true;
                resolve(a.href);
                return;
            }
        }
        reject("No insta found");
    }

    function find_insta_then(result) {
        my_query.fields.IGurl=result;
        console.log("insta url=",result);
        var promise=MTP.create_promise(result,AggParser.parse_instagram, parse_insta_then, function(response) {
            console.log("find_insta_then failed, response=",response);

            GM_setValue("returnHit",true); });
    }

    function parse_insta_then(result) {
        console.log("result=",result);
        if(!result.success&&!result.not_found) {
            GM_setValue("automate",false);
            GM_setValue("returnHit",true);
            return;
        }
        if(result&&result.followers) {
            my_query.fields.IGcount=result.followers;
        }
        else if(my_query.found_on_page) {
            my_query.fields.IGcount=0;
        }
        submit_if_done();
    }


    function init_Query()
    {
		bad_urls=bad_urls.concat(default_bad_urls);
        console.log("in init_query");
        var i;
       var url="http://www."+document.querySelector("a").innerText;
        my_query={name,url:url,domain:MTP.get_domain_only(url,true),fields:{IGurl:"",IGcount:""},done:{},
		  try_count:{"query":0},
		  submitted:false};
        my_query.name=my_query.domain.replace(/\..*$/,"");
	console.log("my_query="+JSON.stringify(my_query));
        var search_str;
        var promise=MTP.create_promise(url,find_insta,find_insta_then,function(message) {
            if(message==="No insta found") {
                console.log("No insta, direct to search");
                const queryPromise = new Promise((resolve, reject) => {
                    console.log("Beginning URL search");
                    query_search(my_query.name+" site:instagram.com", resolve, reject, query_response,"query");
                });
                queryPromise.then(find_insta_then)
                    .catch(function(val) {
                    console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });
            }
            else {
                                console.log("trying again with www");

                let promise2=MTP.create_promise("http://"+document.querySelector("a").innerText,find_insta,find_insta_then,function(message) {

                    const queryPromise = new Promise((resolve, reject) => {
                        console.log("Beginning URL search");
                        query_search(my_query.name+" site:instagram.com", resolve, reject, query_response,"query");
                    });
                    queryPromise.then(find_insta_then)
                        .catch(function(val) {
                        console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

                });
            }


        });
    }

})();