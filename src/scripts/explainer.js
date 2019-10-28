import * as d3 from 'd3'
const margin = { top: 10, left: 10, right: 10, bottom: 10 }
const width = 350 - margin.left - margin.right
const height = width
const pct_width = 450
const pct_height = 200

const root_num_squares = 40
const ORDERING = { 's+': 1, 's-': 3, 'h+': 2, 'h-': 4 }
let SICK_PROB = 0.01
let ACCURACY = 0.99
let TRUE_POS = 0
let FALSE_POS = 0
let FALSE_NEG = 0
let TRUE_NEG = 0

const colorList = ['#d7191c', '#fdae61', '#1a9641', '#a6d96a']

const colorScale = d3
	.scaleOrdinal()
	.domain(['s+', 's-', 'h+', 'h-'])
	.range(colorList)
const widthScale = d3
	.scaleBand()
	.domain(d3.range(root_num_squares))
	.range([0.0, width])
	.padding(0.15)

let patients = []
for (var i in d3.range(root_num_squares ** 2)) {
	const o = {}
	o.sick = Math.random() <= SICK_PROB
	o.positive = o.sick
		? Math.random() < ACCURACY
		: Math.random() < 1 - ACCURACY
	o.diag = `${o.sick ? 's' : 'h'}${o.positive ? '+' : '-'}`
	if (o.positive) {
		if (o.sick) {
			TRUE_POS++
		} else {
			FALSE_POS++
		}
	} else {
		if (o.sick) {
			FALSE_NEG++
		} else {
			TRUE_NEG++
		}
	}
	patients.push(o)
}
let p = patients.slice(0)
p = p.sort(function(a, b) {
	return d3.ascending(ORDERING[a.diag], ORDERING[b.diag])
})
p.forEach(function(d, i) {
	d.idx = i
})

let TRUE_PROB =
	(ACCURACY * SICK_PROB) /
	(ACCURACY * SICK_PROB + (1 - ACCURACY) * (1 - SICK_PROB))

let EST_PROB = TRUE_POS / (TRUE_POS + FALSE_POS)

let angleScale = d3
	.scaleLinear()
	.domain([0, 100])
	.range([0, 2 * Math.PI])
let arc = d3
	.arc()
	.innerRadius(0)
	.outerRadius(40)
	.startAngle(0)
	.endAngle(d => angleScale(d))

let bigAngleScale = d3
	.scaleLinear()
	.domain([0, TRUE_POS + FALSE_POS])
	.range([0, 2 * Math.PI])
let finalAngleScale = d3
	.scaleLinear()
	.domain([0, 1])
	.range([0, 2 * Math.PI])

let bigArc = d3
	.arc()
	.innerRadius(0)
	.outerRadius((0.9 * width) / 2)
	.startAngle(d => bigAngleScale(d))
	.endAngle(d => bigAngleScale(d))

let slider = d3.select('#guesser-slider')
let pctSvg = d3
	.select('#chart-1')
	.append('svg')
	.style('margin', 'auto')
	.attr('width', pct_width)
	.attr('height', pct_height)
	.append('g')
	.attr('transform', `translate(${pct_width / 2}, ${pct_height / 2})`)

pctSvg
	.append('path')
	.attr('id', 'pct-arc')
	.attr('d', arc.endAngle(Math.PI))
	.attr('fill', '#fdae61')
	.attr('stroke', 'black')

let guess_text = d3.select('#guess-value')
slider.on('input', function() {
	const chosen = slider.property('value')
	guess_text.text(`${chosen}% chance of having Probaphobia`)
	d3.select('#pct-arc').attr('d', arc.endAngle(angleScale(chosen)))
})

let theButton = d3.select('#the-button')
theButton.on('click', respondToGuess)

function respondToGuess() {
	d3.selectAll('.isVisible')
		.classed('isHidden', true)
		.classed('isVisible', false)

	let selection = '.result--close'
	const guess = slider.property('value')
	if (guess > 60) {
		selection = '.result--high'
	} else if (guess < 40) {
		selection = '.result--low'
	}

	d3.selectAll('.guess-spot')
		.text(`${slider.property('value')}%`)
		.attr('text-color', '#fdae61')

	d3.select('#guess-response').classed('isEnter', false)
	d3.select(selection)
		.classed('isVisible', true)
		.classed('isHidden', false)

	pctSvg
		.select('path')
		.transition()
		.duration(500)
		.ease(d3.easeLinear)
		.attr('transform', `translate(${-pct_width / 4}, 0)`)
		.on('end', function() {
			pctSvg
				.append('text')
				.text(`Your Guess (${guess}%)`)
				.attr('dx', -pct_width / 4)
				.attr('dy', 80)
				.transition()
				.duration(500)
				.attr('opacity', 1)
			pctSvg
				.append('text')
				.text('True Probability (50%)')
				.attr('dx', pct_width / 4)
				.attr('dy', 80)
				.transition()
				.duration(500)
				.attr('opacity', 1)
			pctSvg
				.append('path')
				.attr('id', 'pct-arc-true')
				.attr('d', arc.endAngle(Math.PI))
				.attr('transform', `translate(${pct_width / 4},0)`)
				.attr('fill', '#d7191c')
				.attr('stroke', 'black')
				.transition()
				.duration(500)
				.attr('opacity', 1)
		})
	theButton.text('But why is it only 50%?').on('click', startExplanation)
}

function startExplanation() {
	d3.select('#guess-response')
		.classed('isHidden', true)
		.classed('isVisible', false)
	d3.select('#explanation-start')
		.classed('isVisible', true)
		.classed('isEnter', false)
	theButton.text("Let's get testing!").on('click', testIndividuals)
	pctSvg.remove()
	pctSvg = d3
		.select('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.top)
		.append('g')
		.attr('transform', `translate(${margin.left},${margin.top})`)
	pctSvg
		.selectAll('.block')
		.data(patients)
		.enter()
		.append('rect')
		.attr('class', 'block')
		.attr('width', widthScale.bandwidth())
		.attr('height', widthScale.bandwidth())
		// .attr('fill', d => colorScale(d.diag))
		.attr('fill', 'lightgrey')
		.attr('stroke', 'none')
		.attr('x', width + 50)
		.attr('y', height + 50)
		.transition()
		.duration(500)
		.delay(function(d, i) {
			return i * 2
		})
		.attr('x', (d, i) => widthScale(i % root_num_squares))
		.attr('y', function(d, i) {
			return widthScale(Math.floor(i / root_num_squares))
		})
}

function testIndividuals() {
	d3.select('#explanation-start')
		.classed('isHidden', true)
		.classed('isVisible', false)
	d3.select('#explanation-tested')
		.classed('isVisible', true)
		.classed('isEnter', false)
	d3.select('.negative-str').text(
		`${1600 - TRUE_POS - FALSE_POS} people tested negative`
	)
	d3.select('.positive-str').text(
		`${TRUE_POS + FALSE_POS} people tested positive`
	)
	theButton.text("Group 'em up for me").on('click', groupTests)

	pctSvg
		.selectAll('.block')
		.transition()
		.duration(500)
		.delay(function(d, i) {
			return i * 2
		})
		.attr('fill', d => (d.positive ? '#d7191c' : '#a6d96a'))
}

function groupTests() {
	d3.select('#explanation-tested')
		.classed('isHidden', true)
		.classed('isVisible', false)
	d3.select('#explanation-tested-ordered')
		.classed('isVisible', true)
		.classed('isEnter', false)

	pctSvg
		.selectAll('rect.block')
		.transition()
		.duration(500)
		.delay(function(d, i) {
			return i * 2
		})
		.attr('x', d => widthScale(d.idx % root_num_squares))
		.attr('y', function(d) {
			return widthScale(Math.floor(d.idx / root_num_squares))
		})

	theButton.text('Ten Years Later...').on('click', revealHealth)
}

function revealHealth() {
	d3.select('#explanation-tested-ordered')
		.classed('isHidden', true)
		.classed('isVisible', false)
	d3.select('#explanation-healthy')
		.classed('isVisible', true)
		.classed('isEnter', false)
	const selection = FALSE_NEG > 0 ? '.false-negatives' : '.no-false-negatives'
	d3.select('.negative-h-str').text(
		`${TRUE_NEG} healthy people tested negative`
	)
	d3.select('.positive-s-str').text(`${TRUE_POS} sick people tested positive`)
	d3.select('.positive-h-str').text(
		`${FALSE_POS} healthy people who tested positive`
	)
	d3.select('.negative-s-str').text(
		`${FALSE_NEG} sick ${
			FALSE_NEG > 1 ? 'people' : 'person'
		} tested negative!`
	)
	d3.select(selection)
		.classed('isVisible', true)
		.classed('isHidden', false)
	pctSvg
		.selectAll('rect.block')
		.filter(function(d) {
			return d.diag === 's-' || d.diag === 'h+'
		})
		.raise()
		.transition()
		.duration(100)
		.delay(function(_, i) {
			return i * 200
		})
		.ease(d3.easeCubic)
		.attr('fill', d => colorScale(d.diag))
		.attr('width', widthScale.bandwidth() * 5)
		.attr('height', widthScale.bandwidth() * 5)
		.attr('x', function() {
			return d3.select(this).attr('x') - 2 * widthScale.bandwidth()
		})
		.attr('y', function() {
			return d3.select(this).attr('y') - 2 * widthScale.bandwidth()
		})
		.on('end', function() {
			const item = d3.select(this)
			item.transition()
				.duration(100)
				.ease(d3.easeCubic)
				.attr('width', widthScale.bandwidth())
				.attr('height', widthScale.bandwidth())
				.attr('x', d => widthScale(d.idx % root_num_squares))
				.attr('y', d =>
					widthScale(Math.floor(d.idx / root_num_squares))
				)
		})

	theButton.text("Let's focus.").on('click', removeNegatives)
}

function removeNegatives() {
	d3.select('#explanation-healthy')
		.classed('isHidden', true)
		.classed('isVisible', false)
	d3.select('#explanation-all-pos')
		.classed('isVisible', true)
		.classed('isEnter', false)
	pctSvg
		.selectAll('rect.block')
		.filter(function(d) {
			return !(d.diag === 's+' || d.diag === 'h+')
		})
		.transition()
		.duration(500)

		.style('opacity', 0.2)

	theButton
		.text('Remove the Negative Nancies!')
		.on('click', highlightPositives)
}

function highlightPositives() {
	d3.select('#explanation-all-pos')
		.classed('isHidden', true)
		.classed('isVisible', false)
	d3.select('#explanation-zoomed')
		.classed('isVisible', true)
		.classed('isEnter', false)
	const bigger = Math.max(TRUE_POS, FALSE_POS)
	pctSvg
		.selectAll('rect.block')
		.filter(function(d) {
			return !(d.diag === 's+' || d.diag === 'h+')
		})
		.remove()
	const filteredXScale = d3
		.scaleBand()
		.domain(d3.range(Math.max(TRUE_POS, FALSE_POS)))
		.range([0, width])
		.padding(0.1)
	const filteredYScale = d3
		.scaleBand()
		.domain(['s+', 'h+'])
		.range([height / 4, (3 * height) / 4])
	pctSvg
		.selectAll('rect.block')
		.transition()
		.duration(500)
		.ease(d3.easeCubic)
		.attr('width', filteredXScale.bandwidth())
		.attr('height', filteredXScale.bandwidth())
		.attr('x', function(_, i) {
			return filteredXScale(i < bigger ? i : i - bigger)
		})
		.attr('y', d => filteredYScale(d.diag))
	pctSvg
		.append('text')
		.attr('x', width / 2)
		.attr('y', filteredYScale('s+'))
		.attr('fill', colorScale('s+'))
		.attr('text-anchor', 'middle')
		.attr('dy', -10)
		.style('opacity', 0)
		.transition()
		.duration(300)
		.delay(500)
		.text(`${TRUE_POS} True Positives`)
		.style('opacity', 1)
	pctSvg
		.append('text')
		.attr('x', width / 2)
		.attr('y', filteredYScale('h+'))
		.attr('fill', colorScale('h+'))
		.attr('text-anchor', 'middle')
		.attr('dy', 20 + filteredXScale.bandwidth())
		.style('opacity', 0)
		.transition()
		.duration(300)
		.delay(500)
		.text(`${FALSE_POS} False Positives`)
		.style('opacity', 1)

	theButton
		.text('Do the math. Show me the good stuff.')
		.on('click', grandFinale)
}

function grandFinale() {
	d3.select('#explanation-zoomed')
		.classed('isHidden', true)
		.classed('isVisible', false)
	const finale = d3.select('#explanation-finale')

	d3.select('#explanation-finale')
		.classed('isVisible', true)
		.classed('isEnter', false)
	finale.select('.positive-s-str').text(`${TRUE_POS} true positives`)
	finale.select('.total').text(`${TRUE_POS + FALSE_POS} true positives`)
	finale.select('.pct').text(`${Math.round(EST_PROB * 1000) / 10}%`)

	pctSvg
		.selectAll('rect.block')
		.transition()
		.duration(500)
		.style('opacity', 0)
	pctSvg
		.selectAll('text')
		.transition()
		.duration(500)
		.style('opacity', 0)
	const middle = pctSvg
		.append('g')
		.attr('transform', `translate(${width / 2},${height / 2})`)

	middle
		.append('path')
		.style('opacity', 0)
		.attr('id', 'tp')
		.transition()
		.duration(500)
		.delay(500)
		.attr('d', bigArc.startAngle(0).endAngle(bigAngleScale(TRUE_POS)))
		.attr('fill', colorScale('s+'))
		.attr('stroke', 'black')
		.style('opacity', 1)
	middle
		.append('path')
		.attr('id', 'fp')
		.style('opacity', 0)
		.transition()
		.duration(500)
		.delay(500)
		.attr(
			'd',
			bigArc.startAngle(bigAngleScale(TRUE_POS)).endAngle(Math.PI * 2)
		)
		.attr('stroke', 'black')
		.attr('fill', colorScale('h+'))
		.style('opacity', 1)

	middle
		.append('text')
		.text(`${Math.round(EST_PROB * 1000) / 10}%`)
		.attr('y', width / 2)
		.attr('x', 0)
		.style('opacity', 0)
		.attr('text-anchor', 'middle')

		.transition()
		.duration(500)
		.delay(500)
		.style('opacity', 1)

	middle
		.select('#fp')
		.transition()
		.duration(500)
		.delay(1500)
		.style('opacity', 0.2)

	theButton.text('Let me explore.').on('click', playground)
}

function playground() {
	d3.selectAll('rect').remove()
	d3.select('#explanation-finale')
		.classed('isHidden', true)
		.classed('isVisible', false)
	d3.select('#playground')
		.classed('isVisible', true)
		.classed('isHidden', false)
	theButton.remove()
	d3.select('#fp').style('opacity', 1)

	let acc_slider = d3.select('#accuracy-slider')
	let occ_slider = d3.select('#occurrence-slider')
	acc_slider.on('input', function() {
		const a = +acc_slider.property('value') / 100
		const o = +occ_slider.property('value') / 100
		redoProbs(a, o)
	})
	occ_slider.on('input', function() {
		const a = +acc_slider.property('value') / 100
		const o = +occ_slider.property('value') / 100
		redoProbs(a, o)
	})
}

function redoProbs(a, o) {
	const t = (a * o) / (a * o + (1 - a) * (1 - o))
	d3.select('#acc-label').text(`${a * 100}% Device Accuracy`)
	d3.select('#tp').attr(
		'd',
		bigArc.startAngle(0).endAngle(finalAngleScale(t))
	)
	d3.select('#fp').attr(
		'd',
		bigArc.startAngle(finalAngleScale(t)).endAngle(Math.PI * 2)
	)
	d3.select('g')
		.select('g')
		.select('text')
		.text(`${Math.round(t * 1000) / 10}% Chance of Probaphobia`)
}

// const waffle = d3
// 	.select('#chart-1')
// 	.append('svg')
// 	.style('margin', 'auto')
// 	.attr('width', width + margin.left + margin.right)
// 	.attr('height', height + margin.top + margin.bottom)
// 	.append('g')
// 	.attr('transform', `translate(${margin.left},${margin.top})`)

// waffle
// 	.selectAll('.block')
// 	.data(patients)
// 	.enter()
// 	.append('rect')
// 	.attr('class', 'block')
// 	.attr('x', (d, i) => widthScale(i % root_num_squares))
// 	.attr('y', function(d, i) {
// 		return widthScale(Math.floor(i / root_num_squares))
// 	})
// 	.attr('width', widthScale.bandwidth())
// 	.attr('height', widthScale.bandwidth())
// 	.attr('fill', d => colorScale(d.diag))
// 	.attr('stroke', 'none')
