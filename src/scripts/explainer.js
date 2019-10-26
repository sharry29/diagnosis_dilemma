import * as d3 from 'd3'

const margin = { top: 50, left: 50, right: 50, bottom: 50 }
const width = 600 - margin.left - margin.right
const height = width
const pct_width = 500
const pct_height = 200

const root_num_squares = 40
const ORDERING = { 's+': 1, 's-': 2, 'h+': 3, 'h-': 4 }
let SICK_PROB = 0.01
let ACCURACY = 0.99
let TRUE_POS = 0
let FALSE_POS = 0

const colorList = ['#d7191c', '#fdae61', '#1a9641', '#a6d96a']
//

const goOut = d3
	.transition()
	.duration(1000)
	.ease(d3.easeCubic)

const comeIn = d3
	.transition()
	.duration(1000)
	.ease(d3.easeCubic)

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
	}
	patients.push(o)
}
patients = patients.sort(function(a, b) {
	return d3.ascending(ORDERING[a.diag], ORDERING[b.diag])
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

let slider = d3.select('#guesser_slider')
let pctSvg = d3
	.select('#pct_viz')
	.style('margin', 'auto')
	.attr('width', pct_width)
	.attr('height', pct_height)
	.append('g')
	.attr('transform', `translate(${pct_width / 2}, ${pct_height / 2})`)

pctSvg
	.append('path')
	.attr('id', 'pct_arc')
	.attr('d', arc.endAngle(Math.PI))
	.attr('fill', '#fdae61')
	.attr('stroke', 'black')

let guess_text = d3.select('#guess_value')
slider.on('input', function() {
	const chosen = slider.property('value')
	guess_text.text(`${chosen}% chance of having Probaphobia`)
	d3.select('#pct_arc').attr('d', arc.endAngle(angleScale(chosen)))
})

d3.select('#guess_scene').on('click', respondToGuess)

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
				.text('Your Guess')
				.attr('dx', -pct_width / 4)
				.attr('dy', 80)
				.transition()
				.duration(500)
				.attr('opacity', 1)
			pctSvg
				.append('text')
				.text('True Probability')
				.attr('dx', pct_width / 4)
				.attr('dy', 80)
				.transition()
				.duration(500)
				.attr('opacity', 1)
			pctSvg
				.append('path')
				.attr('id', 'pct_arc')
				.attr('d', arc.endAngle(Math.PI))
				.attr('transform', `translate(${pct_width / 4},0)`)
				.attr('fill', '#a6d96a')
				.attr('stroke', 'black')
				.transition()
				.duration(500)
				.attr('opacity', 1)
		})
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
