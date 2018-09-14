// ==UserScript==
// @name         GNGF
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  For GNGF
// @author       You
// @include        http://*.mturkcontent.com/*
// @include        https://*.mturkcontent.com/*
// @include        http://*.amazonaws.com/*
// @include        https://*.amazonaws.com/*
// @include https://worker.mturk.com/*
// @include file://*
// @grant  GM_getValue
// @grant GM_setValue
// @grant GM_addValueChangeListener
// @grant        GM_setClipboard
// @grant GM_xmlhttpRequest
// @grant GM_openInTab
// @grant GM_getResourceText
// @grant GM_addStyle
// @connect google.com
// @connect bing.com
// @connect yellowpages.com
// @connect compass.doe.in.gov
// @connect *
// @connect crunchbase.com
// @require https://raw.githubusercontent.com/hassansin/parse-address/master/parse-address.min.js
// @require https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/jacobsscriptfuncs.js
// @resource GlobalCSS https://raw.githubusercontent.com/jacobmas/MTurkScripts/master/global/globalcss.css
// ==/UserScript==


// VCF Do something with?
(function() {
    'use strict';

    var automate=GM_getValue("automate",false);
    var email_re = /(([^<>()\[\]\\.,;:\s@"：+=\/\?%]+(\.[^<>()\[\]\\.,;:：\s@"\?]+)*)|("[^\?]+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/g;

    var phone_re=/[\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6} (?:(ext\.|x)\s*\d+)?/im;
    var fax_re=/Fax[:]?[\s]?([\+]?[(]?[0-9]{3}[)]?[-\s\.\/]+[0-9]{3}[-\s\.\/]+[0-9]{4,6})/im;


    var personal_email_domains=["aol.com","bigpond.com","frontiernet.net","gmail.com","icloud.com","mchsi.com","me.com","pacbell.net","rogers.com","rr.com","ymail.com"];
    var my_query = {};
    var email_list=[];
    var sch_name="School District Name", sch_domain="Domain of school district";
    var bad_urls=[];
    var country_domains=[".ar",".at",".au",".br",".ch",".cn",".de",".eu",".fr",".it",".jp",".ro",".ru",".se",".tw",".uk",".uy",".vn"];
    var first_try=true;

    function check_function()
    {
	return true;
    }
    function check_and_submit(check_function)
    {
        console.log("in check");
        
        console.log("Checking and submitting");


        console.log("automate="+GM_getValue("automate"));
        if(GM_getValue("automate"))
        {
            setTimeout(function() { document.getElementById("submitButton").click(); }, 0);
        }
    }
    function is_bad_name(b_name)
    {
	return false;
    }

        function parse_name_func(text)
    {
        var split_str,fname,lname;
        var appell=[/^Mr[\.]?\s+/,/^Mrs[\.]?\s+/,/^Ms[\.]?\s+/,/^Miss\s+/,/^Dr[\.]?\s+/];

        var i;
        for(i=0; i < appell.length; i++) text=text.replace(appell[i],"");
        text=text.replace(/^([^,]+),\s*(.*)$/,"$2 $1");

        return text;
    }

    function paste_webpage(e)
    {
       e.preventDefault();
        // get text representation of clipboard
       var text = e.clipboardData.getData("text/plain");
       var total=document.getElementById("00Counselors").value;
        var num_re=/^[\d]+$/;
        var num=0;
        if(!num_re.test(total))
        {
            console.log("num re test failed");
            document.getElementById(e.target.id).value=text;
            return;
        }
        if(total.length>0)
        {
            num=parseInt(total);
        }
        var i;
        var curr_id;
        for(i=1; i <= num; i++)
        {
           curr_id=(i).toString();
            if(i < 10) curr_id="0"+curr_id;
            curr_id=curr_id+"Furl";
            document.getElementById(curr_id).value=text;
        }
    }
    function strip_null_blank(str_array)
    {
        var ret_array=[];
        for(var i=0; i < str_array.length; i++)
        {
            var curr_str=str_array[i];
            if(curr_str!==null && curr_str!==undefined && curr_str.length>0 && curr_str.indexOf(".jpg")===-1) ret_array.push(curr_str.replace(/^([^:]*:)/,""));
        }
        return ret_array;
    }
    function do_data_paste(e)
    {
        e.preventDefault();
        var text = e.clipboardData.getData("text/plain");

            data_paste_func(text);

    }
    function data_paste_func(text) {
        // cancel paste
        //e.preventDefault();
        // get text representation of clipboard
       // var text = e.clipboardData.getData("text/plain");
        console.log("IN data paste, text="+text);
        var fname="",lname="";
        var i=0,j=0, k=0;
        var curr_line, second_part_line="", second_arr;
        var has_pasted_title=false;
        var split_lines_1=text.split(/\s*\n\s*|\t|–|(\s+-\s+)|\||                     |	|	|●|•/);
        var split_lines=[];
        var found_email=false;
        var ret=parse_data_func(text);

        var fullname=parse_name(ret.name);

        document.getElementById("firstName").value=fullname.fname;
        document.getElementById("lastName").value=fullname.lname;
        document.getElementById("title").value=ret.title;
        if(ret.email.trim().length>0) document.getElementById("email").value=ret.email.trim();
        if(ret.phone.length>0) {
            document.getElementById("phone").value=ret.phone;
        }
        return true;



    }

    function substring_in_strings(strings, to_check)
    {
        var j;
        for(j=0; j < strings.length; j++) {
           // console.log("to_check=\""+to_check+"\", strings["+j+"]=\""+strings[j]+"\"");
            if(to_check.toLowerCase().indexOf(strings[j].toLowerCase())!==-1) return true;
        }
        return false;
    }

    function parse_data_func(text)
    {

        var ret={name:"",email:"",title:"",phone:""};
        var fname="",lname="",i=0,j=0, k=0;
        var curr_line, second_part_line="", second_arr;
        var has_pasted_title=false;
        var split_lines_1=text.split(/\s*\n\s*|\t|–|(\s+-\s+)|\||                     |	|	|●|•/);
        var split_lines=[];
        var found_email=false, found_phone=false;

        var to_flip=false;
        for(i=0; i < split_lines_1.length; i++)
        {
            if(split_lines_1[i]!==undefined && split_lines_1[i]!==null)
            {
                /* Check if commas need to be split out */
                var new_split;
                if(i===0 && /^[^\s]+\s+[^\s]+,/.test(split_lines_1[i]))
                {
                    /* It's not a Last, First situation */
                    new_split=split_lines_1[i].split(",");
                    for(j=0; j < new_split.length; j++) split_lines.push(new_split[j].trim());
                }
                else
                {
                    split_lines.push(split_lines_1[i]);
                }
            }
        }


        console.log("parse_data_func: "+JSON.stringify(split_lines));

        var good_stuff_re=/[A-Za-z0-9]/;

        if(split_lines===null) return;
        for(j=0; j < split_lines.length; j++)
        {
            if(split_lines.length>0 && split_lines[j]!==null
               && split_lines[j]!==undefined && split_lines[j].trim().length > 0
               && good_stuff_re.test(split_lines[j])) break;
        }
        var split_comma=split_lines[j].split(/,/);
        var counselor_re=/Counselor/i;
        if(split_comma.length===2 && (counselor_re.test(split_comma[1]) | /[^\s]\s/.test(split_comma[0])))
        {
            var curr_last=split_lines.length-1
            split_lines.push(split_lines[curr_last]);
            for(k=curr_last; k>=j+2; k--)
            {
                split_lines[k]=split_lines[k-1];
            }
            split_lines[j]=split_comma[0];
            split_lines[j+1]=split_comma[1];
        }

        if(split_lines.length>0 && j<split_lines.length&& split_lines[j]!==null &&split_lines[j]!==undefined && split_lines[j].trim().length > 0)
        {
        //    console.log("Hello");
            var begin_name=split_lines[j].trim();
            if(!/\s/.test(begin_name) && j+1 < split_lines.length)
            {
                if(to_flip) begin_name=split_lines[j+1]+" "+begin_name;
                else begin_name=begin_name+" "+split_lines[j+1];
                j=j+1;
            }
            ret.name=parse_name_func(begin_name);
        }
        console.log("split_lines.length="+split_lines.length);
        for(i=j+1; i < split_lines.length; i++)
        {
            found_email=false;
            found_phone=false;
            if(split_lines[i]===undefined || !good_stuff_re.test(split_lines[i])) continue;
            console.log("i="+i+", split_lines[i]="+split_lines[i]);
            curr_line=split_lines[i].trim();

            second_arr=curr_line.split(/:\s+/);
          //  console.log("curr_line="+curr_line+", second_arr.length="+second_arr.length);
            second_part_line=second_arr[second_arr.length-1].trim();
            console.log("second_part_line="+second_part_line);
            if(email_re.test(second_part_line))
            {
                found_email=true;
                console.log("Matched email");
                ret.email=second_part_line.match(email_re)[0];
            }
            if(phone_re.test(second_part_line))
            {
                found_phone=true;
                console.log("Matched phone");
                ret.phone=second_part_line.match(phone_re)[0];
            }
            if(!found_email && !found_phone &&
               second_part_line.trim().length>0 && second_part_line.indexOf("Title:")===-1 && !has_pasted_title
                   )
            {
                has_pasted_title=true;
                ret.title=second_part_line.trim();
            }
            else
            {
                console.log("curr_line="+curr_line);
            }
        }
        return ret;
    }


    function replace_strings(toReplace, replaceMap)
    {
        var x;
        for(x in replaceMap)
        {
            toReplace=toReplace.replace(x, replaceMap[x]);
        }
        return toReplace;
    }

    function parse_lgb(lgb_info)
    {
        var website;
        var b_entityTitle=lgb_info.getElementsByClassName("b_entityTitle");
        if(b_entityTitle.length>0)
        {
            website=b_entityTitle[0].getElementsByTagName("a")[0].href;
            GM_setClipboard(website);
            document.getElementById("website").value=website;
        }
        else
        {
            console.log("not found b_entityTitle");
        }

        
        var bm_details=lgb_info.getElementsByClassName("bm_details_overlay")[0].innerText;
        var parsed=parseAddress.parseLocation(bm_details);
        add_address(parsed);

        var longNum=lgb_info.getElementsByClassName("longNum");
        if(longNum.length>0)
        {
            document.getElementById("phone").value=longNum[0].innerText.replace(/^\+1 /,"");
        }
        console.log("parsed="+JSON.stringify(parsed));

    }
    function parse_b_context(b_context)
    {
        var i;
        var cbtn=b_context.getElementsByClassName("cbtn");
        var b_vList=b_context.getElementsByClassName("b_vList");
        for(i=0; i < cbtn.length; i++)
        {
            if(cbtn[i].innerText==="Website")
            {
                document.getElementById("website").value=cbtn[i].href;
                GM_setClipboard(cbtn[i].href);
            }
        }
        if(b_vList.length>0)
        {
            var bm_details=b_vList[0].getElementsByClassName("bm_details_overlay")[0].innerText;
            var parsed=parseAddress.parseLocation(bm_details);
            add_address(parsed);


            var li_elem=b_vList[0].getElementsByTagName("li");
            for(i=0; i < li_elem.length; i++)
            {
                if(/^Phone:/.test(li_elem[i].innerText))
                {

                    document.getElementById("phone").value=li_elem[i].innerText.replace(/^Phone:\s*\+1\s*/,"");
                }
            }
        }

    }

    function add_address(parsed)
    {
         if(parsed.number!==undefined && parsed.street!==undefined)
            {
                document.getElementById("street").value=parsed.number;
                if(parsed.prefix!==undefined)
                {
                    document.getElementById("street").value=document.getElementById("street").value+" "+parsed.prefix;
                }
                document.getElementById("street").value=document.getElementById("street").value+" "+parsed.street;
                if(parsed.type!==undefined) {
                    document.getElementById("street").value=document.getElementById("street").value+" "+parsed.type;
                }
                if(parsed.suffix!==undefined) {
                    document.getElementById("street").value=document.getElementById("street").value+" "+parsed.suffix;
                }
            }
        if(parsed.zip!==undefined) document.getElementById("zip").value=parsed.zip;
    }

    function query_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search, lgb_info, b_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");
            lgb_info=doc.getElementById("lgb_info");
            b_context=doc.getElementById("b_context");
            if(lgb_info!==null)
            {
                console.log("Found lgb");
                parse_lgb(lgb_info);
                resolve("");
            }
            else if(b_context!==null)
            {
                console.log("Found b_context");
                parse_b_context(b_context);
                resolve("");
            }

            console.log("b_algo.length="+b_algo.length);
            if(b_algo.length===0)
            {
                console.log("b_algo length=0");
                GM_setValue("returnHit",true);
                return;
            }
           
            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText;



                if(!is_bad_url(b_url, bad_urls) && !is_bad_name(b_name))
                {
                    b1_success=true;
		    break;

                }
                
            }
	    if(b1_success)
	    {
		/* Do shit */

	    }
           

        }
        catch(error)
        {
	    console.log("Error "+error);
            reject(error);
            return;
            
            //reject(JSON.stringify({error: true, errorText: error}));
        }
	
//        GM_setValue("returnHit",true);
        return;

    }

    function compass_response(response,resolve,reject) {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in query_response\n"+response.finalUrl);
        var search, b_algo, i=0, inner_a;
	var b_url="crunchbase.com", b_name, b_factrow, b_caption;
        var b1_success=false, b_header_search, lgb_info, b_context;
        try
        {
            search=doc.getElementById("b_content");
            b_algo=search.getElementsByClassName("b_algo");

            for(i=0; i < b_algo.length; i++)
            {
                b_name=b_algo[i].getElementsByTagName("a")[0].textContent;
                b_url=b_algo[i].getElementsByTagName("a")[0].href;
		b_caption=b_algo[i].getElementsByClassName("b_caption")[0].innerText;




                b1_success=true;
                break;

            }
	    if(b1_success)
	    {
		/* Do shit */
            resolve(b_url);
            return;
	    }


        }
        catch(error)
        {
	    console.log("Error "+error);
	    reject(error);
            return;

            //reject(JSON.stringify({error: true, errorText: error}));
        }

//        GM_setValue("returnHit",true);
        return;

    }


    function query_search(search_str, resolve,reject, callback) {
        console.log("Searching with bing for "+search_str);
        var search_URIBing='https://www.bing.com/search?q='+encodeURIComponent(search_str)+"&first=1&rdr=1";
        var domain_URL='https://www.google.com/search?q='+encodeURIComponent(search_str);//+" company");
        GM_xmlhttpRequest({
            method: 'GET',
            url:    search_URIBing,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             callback(response, resolve, reject);
            },
            onerror: function(response) { reject("Fail"); },
            ontimeout: function(response) { reject("Fail"); }


            });
    }

    /* Following the finding the district stuff */
    function compass_promise_then(url) {
        console.log("Fetching url="+url);
        GM_xmlhttpRequest({
            method: 'GET',
            url:    url,

            onload: function(response) {
             //   console.log("On load in crunch_response");
            //    crunch_response(response, resolve, reject);
             parse_compass(response);
            },
            onerror: function(response) { console.log("Fail"); },
            ontimeout: function(response) { console.log("Fail"); }


            });

    }

    function parse_compass(response)
    {
        var doc = new DOMParser()
        .parseFromString(response.responseText, "text/html");
        console.log("in parse_compass\n"+response.finalUrl);
        var entityinfoheader=doc.getElementsByClassName("entityinfoheader")[0];
        var paras=entityinfoheader.getElementsByTagName("p");
        var text_split=paras[1].innerText.split("\n");
        console.log("text_split="+JSON.stringify(text_split));
        document.getElementById("title").value=text_split[1].match(/\s*([A-Za-z]+):\s*/)[1];
        var fullname=parse_name(parse_name_func(text_split[1].replace(/\s*[A-Za-z]+:\s*/,"")).trim());
        console.log(parse_name_func(text_split[1].replace(/\s*Principal:\s*/,"")).trim());
        document.getElementById("email").value=text_split[2].trim();
        document.getElementById("firstName").value=fullname.fname;
        document.getElementById("lastName").value=fullname.lname;
 console.log("JOOOOSEEEE");
        if(paras[0].getElementsByTagName("a").length>0) document.getElementById("website").value=paras[0].getElementsByTagName("a")[0].href;
        var my_phone_re=/Phone: (\(\d\d\d\) \d\d\d\-\d\d\d\d)/;
         console.log("BLOOSEEEE");
        var phone_match=paras[0].innerText.match(my_phone_re);
        console.log("MOOOSEEEE");
        if(phone_match!==null && document.getElementById("phone").value.length===0)
        {
            document.getElementById("phone").value=phone_match[1];
        }
        my_query.doneContact=true;
        console.log("Done contact");
        do_finish();



    }

    function query_promise_then(url) {
        my_query.doneAddress=true;
        console.log("Done address");
        do_finish();

    }

    function do_finish()
    {
        console.log("Doing finish");
        if(my_query.doneAddress && my_query.doneContact)
        {
            console.log("We're done");
            check_and_submit(check_function,automate);
        }
    }




    function shorten_school_name(school_name)
    {
        school_name=school_name.replace("Junior-Senior","Jr-Sr").replace("Senior High","Sr High");
        return school_name;
    }

    function init_Query()
    {
        document.getElementById("industry").value="N/A";
       my_query={schoolName: document.getElementById("schoolName").value,
                city: document.getElementById("city").value,
                state: document.getElementById("state").value, doneAddress: false, doneContact: false};

        my_query.short_schoolname=shorten_school_name(my_query.schoolName);


        document.getElementById("firstName").addEventListener("paste", do_data_paste);

	var search_str=my_query.schoolName+" "+my_query.city+" "+my_query.state;
        const queryPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, query_response);
        });
        queryPromise.then(query_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this queryPromise " + val); GM_setValue("returnHit",true); });

      search_str=my_query.short_schoolname+" site:compass.doe.in.gov";
        const compassPromise = new Promise((resolve, reject) => {
            console.log("Beginning URL search");
            query_search(search_str, resolve, reject, compass_response);
        });
        compassPromise.then(compass_promise_then
        )
        .catch(function(val) {
           console.log("Failed at this compassPromise " + val); GM_setValue("returnHit",true); });





    }

    /* Failsafe to stop it  */
    window.addEventListener("keydown",function(e) {
        if(e.key !== "F1") {
            return;
        }
        GM_setValue("stop",true);
     });


    if (window.location.href.indexOf("mturkcontent.com") !== -1 || window.location.href.indexOf("amazonaws.com") !== -1)
    {
        var submitButton=document.getElementById("submitButton");
        if(!submitButton.disabled )
        {

            init_Query();
        }

    }
    else if(window.location.href.indexOf("instagram.com")!==-1)
    {
        GM_setValue("instagram_url","");
        GM_addValueChangeListener("instagram_url",function() {
            var url=GM_getValue("instagram_url");
            window.location.href=url;
        });
        do_instagram();
    }
    else if(window.location.href.indexOf("mturk.com")!==-1)
    {
var btns_primary=document.getElementsByClassName("btn-primary");
        var btns_secondary=document.getElementsByClassName("btn-secondary");
	/* Should be MTurk itself */
        var globalCSS = GM_getResourceText("globalCSS");
        GM_addStyle(".btn-ternary { border: 1px solid #FA7070; background-color: #FA7070; color: #111111; }");
       var pipeline=document.getElementsByClassName("work-pipeline-action")[0];
        if(GM_getValue("automate")===undefined) GM_setValue("automate",false);

        var btn_span=document.createElement("span");
        var btn_automate=document.createElement("button");

         
         var my_secondary_parent=pipeline.getElementsByClassName("btn-secondary")[0].parentNode;
        btn_automate.className="btn btn-ternary m-r-sm";
        btn_automate.innerHTML="Automate";
        btn_span.appendChild(btn_automate);
        pipeline.insertBefore(btn_span, my_secondary_parent);
         GM_addStyle(globalCSS);
        if(GM_getValue("automate"))
        {
            btn_automate.innerHTML="Stop";
            // Return automatically if still automating
            setTimeout(function() {

                if(GM_getValue("automate")) btns_secondary[0].click();
                }, 20000);
        }
        btn_automate.addEventListener("click", function(e) {
            var auto=GM_getValue("automate");
            if(!auto) btn_automate.innerHTML="Stop";
            else btn_automate.innerHTML="Automate";
            GM_setValue("automate",!auto);
        });
        GM_setValue("returnHit",false);
        GM_addValueChangeListener("returnHit", function() {
            if(GM_getValue("returnHit")!==undefined && GM_getValue("returnHit")===true &&
               btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Return"
              )
            {
                if(GM_getValue("automate")) {
                    setTimeout(function() { btns_secondary[0].click(); }, 0); }
            }
        });
        /* Regular window at mturk */

       
        if(GM_getValue("stop") !== undefined && GM_getValue("stop") === true)
        {
        }
        else if(btns_secondary!==undefined && btns_secondary.length>0 && btns_secondary[0].innerText==="Skip" &&
                btns_primary!==undefined && btns_primary.length>0 && btns_primary[0].innerText==="Accept")
        {

            /* Accept the HIT */
            if(GM_getValue("automate")) {
                btns_primary[0].click(); }
        }
        else
        {
            /* Wait to return the hit */
            var cboxdiv=document.getElementsByClassName("checkbox");
            var cbox=cboxdiv[0].firstChild.firstChild;
            if(cbox.checked===false) cbox.click();
        }

    }


})();