const PDFMerger = require('@severi/pdf-merger-js');

const mergePdfs= async(filePaths) => {
    var merger = new PDFMerger();
 for (let p of filePaths) {
  try {
    await merger.add(p);
  } catch (err) {
    console.error(`Failed to add ${p}:`, err.message);
  }
}


const d=new Date().getTime()
  await merger.save(`public/${d}.pdf`);
  return d //save under given name and reset the internal document
}


module.exports = { mergePdfs };
