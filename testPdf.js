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

//   merger.add('pdf2.pdf', [1, 3]); // merge the pages 1 and 3
//   merger.add('pdf2.pdf', '4, 7, 8'); // merge the pages 4, 7 and 8
//   merger.add('pdf3.pdf', '1 to 2'); //merge pages 1 to 2
//   merger.add('pdf3.pdf', '3-4'); //merge pages 3 to 4
const d=new Date().getTime()
  await merger.save(`public/${d}.pdf`);
  return d //save under given name and reset the internal document
}


module.exports = { mergePdfs };
