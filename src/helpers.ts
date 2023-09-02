const isEmptyObject= (obj) => {
    return !Object.keys(obj).length;
}

// Used to print in console results
const outputMessage= (message?,element?) =>
{
    const util= require('util');

    if (message)
        console.log(message);

    if (element)
        console.log(util.inspect(element, {showHidden: false, depth: null, colors: true}));
}


export {isEmptyObject,outputMessage};