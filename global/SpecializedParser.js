
var SpecialParser={}; // generic object

/* Michigan bar, query={first:John,last:Doe} */
SpecialParser.parse_michigan_bar=function(doc,url,resolve,reject,query) {
    var query_url="https://www.michbar.org/memberdirectory/home";
    var form=doc.querySelector("form"),x;
    var headers={"Content-Type":"application/x-www-form-urlencoded","host":"www.michbar.org",
                 "origin":"https://www.michbar.org","referer":"https://www.michbar.org/memberdirectory/home",
                 "Upgrade-Insecure-Requests": "1"};
    var data={},i,j,inp=form.querySelectorAll("input,select"),sel=form.getElementsByTagName("select"),data_str;
    for(i=0;i<inp.length;i++) {
	if((inp[i].tagName==="INPUT" &&
	    (inp[i].type==="hidden"||inp[i].type==="text"||
	     ((inp[i].type==="radio"||inp[i].type==="checkbox") && inp[i].checked)|| (inp[i].type==="submit"&&inp[i].value==="Search"))) || inp[i].tagName==="SELECT") data[inp[i].name]=inp[i].value;
    }
    var first=form.querySelector("input[name$='$txtFirstName']"),last=form.querySelector("input[name$='$txtLastName']");
    var submit=form.querySelector("input[type='submit']");
    data[first.name]=query.first;
    data[last.name]=query.last;
    data_str=MTP.json_to_post(data).replace(/%20/g,"+");
    GM_xmlhttpRequest({method: 'POST', url: query_url,data:data_str,headers:headers,
                       onload: function(response) {
                           var doc = new DOMParser().parseFromString(response.responseText, "text/html");
                           SpecialParser.parse_mi_result(doc,response.finalUrl, resolve, reject,query); },
                       onerror: function(response) { reject("Fail"); },ontimeout: function(response) { reject("Fail"); }});
};
SpecialParser.parse_mi_result=function(doc,url,resolve,reject,query) {
    console.log("parse_mi_result, url="+url);
    var a_panel=doc.querySelector(".memberSearchPanel a");
    if(a_panel) {
        var promise=MTP.create_promise(MTP.fix_remote_url(a_panel.href,url),
				       SpecialParser.parse_mi_bar_profile,resolve,reject);
    }
    else reject("Failed to find url link to person in query="+JSON.stringify(query));
}
SpecialParser.parse_mi_bar_profile=function(doc,url,resolve,reject) {
    console.log("parse_mi_bar_profile,url="+url);
    var ret={};
    var company=doc.querySelector("[id$='lblCompany']");
    var citystate=doc.querySelector("[id$='lblCityStateZip']");
    var search_str,email=doc.querySelector("a[id$='Email']");
    if(company&&citystate) {
	Object.assign(ret,{company:company.innerText.trim(),city:citystate.innerText.replace(/,.*$/,"")});
    }
    if(email) {
        var temp_email=email.href.replace(/^\s*mailto:\s*/,"").trim();
        console.log("temp_email="+temp_email);
        ret.email=email.href.replace(/^\s*mailto:\s*/,"");
    }
    resolve(ret);
};
